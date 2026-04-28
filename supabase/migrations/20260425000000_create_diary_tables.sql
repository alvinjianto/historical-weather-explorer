-- diary_entries: one entry per (user, date), optionally tied to a location
create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  content text not null default '',
  location_name text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.diary_entries enable row level security;

create policy "Users can read their own diary entries"
  on public.diary_entries for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own diary entries"
  on public.diary_entries for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own diary entries"
  on public.diary_entries for update
  using ((select auth.uid()) = user_id);

create policy "Users can delete their own diary entries"
  on public.diary_entries for delete
  using ((select auth.uid()) = user_id);

create index diary_entries_user_id_idx on public.diary_entries (user_id);

-- diary_photos: many photos per diary entry
create table public.diary_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  diary_entry_id uuid not null references public.diary_entries(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  created_at timestamptz not null default now()
);

alter table public.diary_photos enable row level security;

create policy "Users can read their own diary photos"
  on public.diary_photos for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own diary photos"
  on public.diary_photos for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own diary photos"
  on public.diary_photos for delete
  using ((select auth.uid()) = user_id);

create index diary_photos_entry_id_idx on public.diary_photos (diary_entry_id);
create index diary_photos_user_id_idx on public.diary_photos (user_id);

-- Storage RLS for the diary-photos bucket
-- Files are stored at {user_id}/{date}/{filename}, so foldername(name)[1] is the user_id
create policy "Users can upload their own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'diary-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read their own photos"
  on storage.objects for select
  using (
    bucket_id = 'diary-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own photos"
  on storage.objects for delete
  using (
    bucket_id = 'diary-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
