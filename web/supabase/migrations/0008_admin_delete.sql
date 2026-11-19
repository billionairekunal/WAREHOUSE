-- Admins may delete any listing (owners can still only delete their own drafts).
create policy "admin deletes listings" on public.listings for delete using (public.is_admin());
