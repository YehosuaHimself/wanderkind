import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Share, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing } from '../../../src/lib/theme';
import { WKHeader } from '../../../src/components/ui/WKHeader';
import { useAuth } from '../../../src/stores/auth';
import { toast } from '../../../src/lib/toast';
import { haptic } from '../../../src/lib/haptics';

type ShareType = 'way' | 'profile' | 'stamp';

export default function SocialShareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profile } = useAuth();

  const shareType = (params.type as ShareType) || 'profile';
  const wayName = (params.wayName as string) || '';
  const wayImage = (params.wayImage as string) || '';
  const wayCountries = (params.countries as string) || '';
  const wayDays = (params.days as string) || '';

  const [generating, setGenerating] = useState(false);

  const trailName = profile?.trail_name || 'A Wanderkind';
  const appUrl = 'https://wanderkind.love';

  const generateShareCard = (): string => {
    const date = new Date().toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    if (shareType === 'way') {
      return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta property="og:title" content="${wayName} — Wanderkind" />
<meta property="og:description" content="${trailName} is walking the ${wayName}. ${wayDays} days across ${wayCountries}." />
<meta property="og:image" content="${wayImage}" />
<meta property="og:url" content="${appUrl}" />
<meta name="twitter:card" content="summary_large_image" />
<title>${wayName} — Wanderkind</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#FAF6EF;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{width:420px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.1)}
.hero{height:220px;background:url('${wayImage}') center/cover;position:relative}
.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(transparent 40%,rgba(0,0,0,0.7))}
.hero-text{position:absolute;bottom:16px;left:20px;right:20px;z-index:1;color:#fff}
.hero-text h1{font-size:24px;font-weight:800;text-shadow:0 2px 8px rgba(0,0,0,0.3)}
.hero-text .meta{font-size:12px;opacity:0.85;margin-top:4px;letter-spacing:0.5px}
.body{padding:20px}
.walker{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.avatar{width:44px;height:44px;border-radius:22px;background:#C8762A;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px}
.walker-info .name{font-weight:700;font-size:15px;color:#1A120A}
.walker-info .label{font-size:11px;color:#9B8E7E;letter-spacing:2px;text-transform:uppercase}
.stats{display:flex;gap:8px;margin-bottom:16px}
.stat{flex:1;background:#FAF6EF;border-radius:10px;padding:10px;text-align:center}
.stat .val{font-size:18px;font-weight:800;color:#C8762A}
.stat .lbl{font-size:9px;color:#9B8E7E;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px}
.cta{display:block;text-align:center;background:#C8762A;color:#fff;padding:12px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none}
.footer{text-align:center;padding:12px;font-size:9px;color:#9B8E7E;letter-spacing:2px}
</style></head><body>
<div class="card">
  <div class="hero"><div class="hero-text">
    <h1>${wayName}</h1>
    <div class="meta">${wayCountries}</div>
  </div></div>
  <div class="body">
    <div class="walker">
      <div class="avatar">${trailName.charAt(0).toUpperCase()}</div>
      <div class="walker-info">
        <div class="name">${trailName}</div>
        <div class="label">is walking this way</div>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><div class="val">${wayDays}</div><div class="lbl">Days</div></div>
      <div class="stat"><div class="val">${wayCountries.split(',').length}</div><div class="lbl">Countries</div></div>
      <div class="stat"><div class="val">W</div><div class="lbl">Wanderkind</div></div>
    </div>
    <a class="cta" href="${appUrl}">Join the Walking Revolution</a>
  </div>
  <div class="footer">WANDERKIND &middot; ${date}</div>
</div>
</body></html>`;
    }

    // Profile share card
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta property="og:title" content="${trailName} — Wanderkind" />
<meta property="og:description" content="${trailName} is walking with Wanderkind. Free hospitality. Real community. Open doors." />
<meta property="og:url" content="${appUrl}" />
<meta name="twitter:card" content="summary" />
<title>${trailName} — Wanderkind</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#FAF6EF;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{width:380px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.1);text-align:center;padding:32px 24px}
.avatar{width:80px;height:80px;border-radius:40px;background:#C8762A;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:32px}
h1{font-size:22px;font-weight:800;color:#1A120A;margin-bottom:4px}
.badge{font-size:10px;color:#C8762A;letter-spacing:3px;text-transform:uppercase;font-weight:700;margin-bottom:20px}
.quote{font-size:14px;color:#6B5A3E;line-height:1.6;margin-bottom:20px;padding:0 12px}
.divider{width:40px;height:2px;background:#C8762A;margin:0 auto 20px}
.cta{display:block;background:#C8762A;color:#fff;padding:12px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none}
.footer{margin-top:16px;font-size:9px;color:#9B8E7E;letter-spacing:2px}
</style></head><body>
<div class="card">
  <div class="avatar">${trailName.charAt(0).toUpperCase()}</div>
  <h1>${trailName}</h1>
  <div class="badge">Wanderkind</div>
  <div class="divider"></div>
  <div class="quote">Walking with open doors and open hearts. Every step is a story, every host a friend.</div>
  <a class="cta" href="${appUrl}">Walk With Us</a>
  <div class="footer">WANDERKIND &middot; ${date}</div>
</div>
</body></html>`;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    haptic.light();

    try {
      const html = generateShareCard();

      if (Platform.OS === 'web') {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        toast.success('Share card opened — right-click to save or screenshot');
      } else {
        await Share.share({
          message: shareType === 'way'
            ? `I'm walking the ${wayName} with Wanderkind! ${appUrl}`
            : `I'm a Wanderkind — walking with open doors. ${appUrl}`,
          title: 'Share on Social Media',
        });
      }
    } catch {
      toast.error('Could not generate share card');
    } finally {
      setGenerating(false);
    }
  };

  const handleShareLink = async () => {
    haptic.light();
    try {
      const message = shareType === 'way'
        ? `I'm walking the ${wayName} with Wanderkind! Free hospitality, real community. ${appUrl}`
        : `I'm a Wanderkind — walking the ancient ways with open doors. Join me: ${appUrl}`;

      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(message);
        toast.success('Copied to clipboard');
      } else {
        await Share.share({ message, title: 'Wanderkind' });
      }
    } catch {
      toast.error('Could not share');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WKHeader title="Share on Social" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview Card */}
        <View style={styles.previewCard}>
          {shareType === 'way' && wayImage ? (
            <Image source={{ uri: wayImage }} style={styles.previewImage} resizeMode="cover" />
          ) : null}
          <View style={[styles.previewOverlay, !wayImage && styles.previewOverlayNoImage]}>
            <Text style={styles.previewTitle}>
              {shareType === 'way' ? wayName : trailName}
            </Text>
            <Text style={styles.previewSub}>
              {shareType === 'way'
                ? `${wayDays} days across ${wayCountries}`
                : 'Wanderkind — Walking with open doors'}
            </Text>
          </View>
        </View>

        <Text style={styles.hint}>
          Generate a beautiful share card for Instagram, WhatsApp, or any social platform.
        </Text>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleGenerate}
          disabled={generating}
          activeOpacity={0.8}
        >
          <Ionicons name="image-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>
            {generating ? 'Generating...' : 'Generate Share Card'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleShareLink}
          activeOpacity={0.7}
        >
          <Ionicons name="link-outline" size={18} color={colors.amber} />
          <Text style={styles.secondaryBtnText}>Copy Share Text</Text>
        </TouchableOpacity>

        {/* Social platforms */}
        <Text style={styles.sectionLabel}>SHARE DIRECTLY</Text>
        <View style={styles.socialGrid}>
          {[
            { icon: 'logo-whatsapp' as const, label: 'WhatsApp', color: '#25D366' },
            { icon: 'logo-instagram' as const, label: 'Instagram', color: '#E4405F' },
            { icon: 'logo-facebook' as const, label: 'Facebook', color: '#1877F2' },
            { icon: 'logo-twitter' as const, label: 'X / Twitter', color: '#1DA1F2' },
          ].map(platform => (
            <TouchableOpacity
              key={platform.label}
              style={styles.socialBtn}
              onPress={handleShareLink}
              activeOpacity={0.7}
            >
              <Ionicons name={platform.icon} size={24} color={platform.color} />
              <Text style={styles.socialLabel}>{platform.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },

  previewCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLt,
    marginBottom: spacing.lg,
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  previewOverlayNoImage: {
    backgroundColor: colors.amber,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  previewSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },

  hint: {
    fontSize: 13,
    color: colors.ink3,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.amber,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.amberLine,
    marginBottom: spacing.xl,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.amber,
  },

  sectionLabel: {
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'Courier New',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.amber,
    fontWeight: '600',
    marginBottom: spacing.md,
  },

  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  socialBtn: {
    width: '47%' as any,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLt,
  },
  socialLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
});
