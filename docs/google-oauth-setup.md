# Google Sign-In — dashboard configuration

The "Safari can't open localhost" failure and the shady-looking `gjzhwpzgvdpkflgjesmb.supabase.co` shown in the Google consent screen are **not code issues**. The code in `src/stores/auth.ts → signInWithGoogle()` is correct. Both problems live in two dashboards: Supabase and Google Cloud Console. Fix them in the order below.

## 1. Supabase — fix the redirect (kills the "localhost can't connect" error)

Go to Supabase Dashboard → your Wanderkind project → Authentication → URL Configuration.

**Site URL** — change to:
```
https://wanderkind.love
```
This is the URL Supabase falls back to after OAuth completes if no specific `redirectTo` matches its allow-list. If it's currently `http://localhost:8081` (or similar), that explains the "Safari can't open localhost" error.

**Redirect URLs** — add the following lines (one per line, on the allow-list):
```
https://wanderkind.love
https://wanderkind.love/auth/callback
https://wanderkind.love/*
wanderkind://auth/callback
```
The wildcard line covers any future deep-linked OAuth target. The native scheme covers the iOS app build.

Click **Save**. No restart needed; takes effect immediately.

Test from your phone: tap "Continue with Google" on the live site. The Google consent screen should appear, and after you tap Continue, you should land back on `https://wanderkind.love/auth/callback` — not `localhost`.

## 2. Google Cloud Console — rename the app (kills the "shady supabase URL" branding)

Go to console.cloud.google.com → APIs & Services → OAuth consent screen.

**App name** — change to:
```
Wanderkind
```
This is what Google shows the user during consent. Currently your OAuth client has the auto-generated name based on your Supabase project URL, which is why the screen reads "In gjzhwpzgvdpkflgjesmb.supabase.co anmelden".

**User support email** — set to your email (`yeshuajesuchrist@gmail.com`).

**App logo** — upload the Wanderkind W logo (square, transparent or amber background, at least 120x120px). Without it, Google shows a generic placeholder icon next to the app name.

**Application home page** — `https://wanderkind.love`

**Application privacy policy link** — `https://wanderkind.love/legal/privacy` (or wherever your privacy policy lives)

**Application terms of service link** — `https://wanderkind.love/legal/terms`

**Authorized domains** — make sure `wanderkind.love` is in the list. Add `supabase.co` only if Google complains it's missing for the OAuth callback.

**Developer contact information** — your email.

Click **Save and continue** through to the end.

The change does not require the OAuth client to be re-published, but if you've previously been in "Testing" status, the new name is shown immediately. If your app is in "In production" verification, the old name may persist in Google's cache for up to 24 hours.

### Optional but recommended at the same time

While you're in Google Cloud Console:

- **APIs & Services → Credentials → your OAuth 2.0 Client ID** — confirm the Authorized redirect URIs list includes:
  ```
  https://gjzhwpzgvdpkflgjesmb.supabase.co/auth/v1/callback
  ```
  This is the URL Google calls after the user consents. Supabase then forwards to your Site URL. Without this exact entry, OAuth fails with "redirect_uri_mismatch".

## 3. Verify end-to-end

After both dashboards are saved:

1. From iPhone Safari, open `https://wanderkind.love/signup`.
2. Tap "Continue with Google".
3. Confirm the consent screen reads **"Sign in to Wanderkind"** (not the supabase.co URL).
4. Tap your Google account.
5. Confirm you land on `https://wanderkind.love/auth/callback`, then on `/(auth)/trail-name` (new account) or `/(tabs)/map` (returning).

If any step fails, check:
- Supabase Authentication → Logs for the failed sign-in attempt
- Google Cloud Console → APIs & Services → Credentials → your client ID → recent requests
- Browser DevTools → Network tab for the redirect chain

## Why I can't do this for you

I have no access to your Supabase or Google Cloud Console dashboards. Both require dashboard sign-in and live in your account, not the codebase. The code is ready; the config has to come from you.
