-- RLS policies for storage.objects in the diary-photos bucket.
-- Paths are structured as {user_id}/{date}/{filename}, so foldername(name)[1]
-- is the owning user's ID.

create policy "Users can upload their own diary photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'diary-photos' and
    (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can read their own diary photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'diary-photos' and
    (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own diary photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'diary-photos' and
    (select auth.uid())::text = (storage.foldername(name))[1]
  );
