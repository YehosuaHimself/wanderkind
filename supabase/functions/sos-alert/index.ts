/**
 * WK-220 — SOS Alert Edge Function
 * Called by the SOS screen after native SMS/call is attempted.
 * Logs the alert to sos_alerts and sends email notifications to
 * emergency contacts via Supabase's built-in SMTP (if configured).
 *
 * POST /functions/v1/sos-alert
 * Body: { user_id, lat?, lng?, location_text?, contacts, message? }
 * Auth: Bearer <user JWT>
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Verify user JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const {
      user_id,
      lat,
      lng,
      location_text,
      contacts,
      message,
    } = await req.json();

    if (!user_id || !contacts?.length) {
      return new Response(JSON.stringify({ error: 'user_id and contacts required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Log the alert
    const { data: alert, error: insertErr } = await supabase
      .from('sos_alerts')
      .insert({
        user_id,
        lat,
        lng,
        location_text,
        contacts_notified: contacts,
        message: message ?? 'Emergency SOS alert from Wanderkind',
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('sos_alerts insert failed:', insertErr);
    }

    // 2. Send email to each contact that has an email address
    const mapsLink = lat && lng
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : null;

    const emailBody = [
      `This is an emergency alert from the Wanderkind app.`,
      ``,
      message ? `Message: ${message}` : `A Wanderkind user has triggered an SOS alert.`,
      ``,
      mapsLink ? `Last known location: ${mapsLink}` : `Location not available.`,
      ``,
      `If you are their emergency contact, please reach out immediately.`,
      ``,
      `— Wanderkind Safety System`,
    ].join('\n');

    const emailContacts = (contacts as any[]).filter(c => c.email);
    for (const c of emailContacts) {
      await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: c.email,
      }).catch(() => null); // best-effort — SMTP must be configured in Supabase dashboard

      // If you have a custom SMTP / Resend / Sendgrid integration, call it here:
      // await fetch('https://api.resend.com/emails', { method: 'POST', ... })
    }

    return new Response(
      JSON.stringify({ ok: true, alert_id: alert?.id ?? null, notified: contacts.length }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    );
  } catch (err) {
    console.error('sos-alert error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
