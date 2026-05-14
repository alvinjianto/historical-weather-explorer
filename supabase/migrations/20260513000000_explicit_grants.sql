-- Explicit grants required for Supabase Data API access (PostgREST/supabase-js).
-- As of May 30 2026, new projects no longer grant public-schema tables automatically.
-- All tables are user-scoped via RLS; anon role gets no access.

grant select, insert, update, delete
  on public.user_preferences
  to authenticated, service_role;

grant select, insert, update, delete
  on public.saved_locations
  to authenticated, service_role;

grant select, insert, update, delete
  on public.diary_entries
  to authenticated, service_role;

grant select, insert, update, delete
  on public.diary_photos
  to authenticated, service_role;
