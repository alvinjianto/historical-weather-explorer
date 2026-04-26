-- Automatically maintain updated_at on diary_entries so direct DB writes
-- (migrations, admin tooling) don't leave stale timestamps.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger diary_entries_set_updated_at
  before update on public.diary_entries
  for each row execute function public.set_updated_at();
