-- User preferences: one row per user, stores unit and wind speed settings
create table public.user_preferences (
  user_id uuid references auth.users(id) on delete cascade primary key,
  unit text not null default 'F' check (unit in ('C', 'F')),
  wind_unit text not null default 'mi' check (wind_unit in ('km', 'mi')),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can read their own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

-- Saved locations: bookmarked locations per user
create table public.saved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);

alter table public.saved_locations enable row level security;

create policy "Users can read their own saved locations"
  on public.saved_locations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own saved locations"
  on public.saved_locations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own saved locations"
  on public.saved_locations for delete
  using (auth.uid() = user_id);
