# TODO

## Infrastructure
- [ ] Set up production Supabase cloud instance
  - Create project at supabase.com
  - Enable Google OAuth under Authentication > Providers > Google
  - Run migrations with `supabase link` + `supabase db push`
  - Add production Supabase URL and anon key to Vercel environment variables
- [ ] Set up GitHub Action to automatically run `supabase db push` on merge to `main` when new migrations are present
  - Requires `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID` secrets in GitHub repo settings

## Google OAuth
- [ ] Submit OAuth app for verification at Google (required to remove "unverified app" warning for real users)
  - Requires a privacy policy URL and app description
  - Can take several days for Google to review
- [ ] If a custom domain is set up, update authorized JavaScript origins and redirect URIs in Google Cloud Console and Supabase

## Vercel
- [ ] Add production env vars to Vercel dashboard
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`
- [ ] If a custom domain is set up, update authorized JavaScript origins and redirect URIs in Google Cloud Console and Supabase

## Auth
- [ ] Add additional sign-in methods (magic link, email/password, GitHub, Apple, etc.)
  - Supabase supports all of these with minimal config — just toggle in dashboard and add UI in AuthButton.tsx
  - Magic link and email/password require an SMTP provider in production (e.g. Resend or SendGrid)

## Features
- [ ] Add file storage (Supabase Storage / S3)
