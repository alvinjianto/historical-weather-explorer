-- Add soft delete support to diary tables
alter table public.diary_entries add column deleted_at timestamptz;
alter table public.diary_photos add column deleted_at timestamptz;
