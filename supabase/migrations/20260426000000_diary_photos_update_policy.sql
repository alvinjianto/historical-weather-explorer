-- Allow users to soft-delete their own photos (sets deleted_at)
create policy "Users can update their own diary photos"
  on public.diary_photos for update
  using ((select auth.uid()) = user_id);
