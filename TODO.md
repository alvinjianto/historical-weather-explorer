# TODO

## Infrastructure
- [ ] Set up GitHub Action to automatically run `supabase db push` on merge to `main` when new migrations are present
  - Requires `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID` secrets in GitHub repo settings


## Google OAuth
- [ ] Submit OAuth app for verification at Google (required to remove "unverified app" warning for real users)
  - Requires a privacy policy URL and app description
  - Can take several days for Google to review
- [ ] If a custom domain is set up, update authorized JavaScript origins and redirect URIs in Google Cloud Console and Supabase

## Refactoring
- [ ] Extract photo upload protocol out of `useDiaryEntry` into a `src/lib/` function
  - The hook currently knows about Supabase, signed URLs, and three HTTP calls — storage implementation details that don't belong in a state hook
  - A `uploadDiaryPhoto(file, date, location)` function in `src/lib/` would encapsulate the full protocol and make swapping storage providers or changing the upload flow a single-file change

## Auth
- [ ] Add additional sign-in methods (magic link, email/password, GitHub, Apple, etc.)
  - Supabase supports all of these with minimal config — just toggle in dashboard and add UI in AuthButton.tsx
  - Magic link and email/password require an SMTP provider in production (e.g. Resend or SendGrid)
