-- Harden invite-only signup and require an ACTIVE profile at the RLS boundary.

create or replace function public.current_profile_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.status = 'ACTIVE'
  );
$$;

revoke all on function public.current_profile_is_active() from public;
grant execute on function public.current_profile_is_active() to authenticated;

create or replace function public.consume_invite_code_and_create_profile(
  p_code text,
  p_user_id uuid,
  p_nickname text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used_code text;
  v_used_at timestamptz := now();
begin
  update public.invite_codes
  set
    used_at = v_used_at,
    used_by = p_user_id
  where invite_codes.code = p_code
    and invite_codes.used_at is null
    and invite_codes.expires_at > v_used_at
  returning invite_codes.code into v_used_code;

  if v_used_code is null then
    raise exception 'invite_code_unavailable' using errcode = 'P0001';
  end if;

  insert into public.profiles (id, nickname)
  values (p_user_id, p_nickname);
end;
$$;

revoke all on function public.consume_invite_code_and_create_profile(text, uuid, text) from public;
revoke all on function public.consume_invite_code_and_create_profile(text, uuid, text) from anon;
revoke all on function public.consume_invite_code_and_create_profile(text, uuid, text) from authenticated;
grant execute on function public.consume_invite_code_and_create_profile(text, uuid, text) to service_role;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (public.current_profile_is_active() and (select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (public.current_profile_is_active() and (select auth.uid()) = id)
with check (public.current_profile_is_active() and (select auth.uid()) = id);

drop policy if exists "Authenticated users can read places" on public.places;
create policy "Authenticated users can read places"
on public.places
for select
to authenticated
using (public.current_profile_is_active());

drop policy if exists "Authenticated users can create places" on public.places;
create policy "Authenticated users can create places"
on public.places
for insert
to authenticated
with check (public.current_profile_is_active());

drop policy if exists "Authenticated users can read reviews" on public.reviews;
create policy "Authenticated users can read reviews"
on public.reviews
for select
to authenticated
using (public.current_profile_is_active());

drop policy if exists "Users can create their own reviews" on public.reviews;
create policy "Users can create their own reviews"
on public.reviews
for insert
to authenticated
with check (public.current_profile_is_active() and (select auth.uid()) = user_id);

drop policy if exists "Users can update their own reviews" on public.reviews;
create policy "Users can update their own reviews"
on public.reviews
for update
to authenticated
using (public.current_profile_is_active() and (select auth.uid()) = user_id)
with check (public.current_profile_is_active() and (select auth.uid()) = user_id);

drop policy if exists "Users can delete their own reviews" on public.reviews;
create policy "Users can delete their own reviews"
on public.reviews
for delete
to authenticated
using (public.current_profile_is_active() and (select auth.uid()) = user_id);

drop policy if exists "Authenticated users can read review tags" on public.review_tags;
create policy "Authenticated users can read review tags"
on public.review_tags
for select
to authenticated
using (public.current_profile_is_active());

drop policy if exists "Review owners can create review tags" on public.review_tags;
create policy "Review owners can create review tags"
on public.review_tags
for insert
to authenticated
with check (
  public.current_profile_is_active()
  and exists (
    select 1
    from public.reviews
    where reviews.id = review_tags.review_id
      and reviews.user_id = (select auth.uid())
  )
);

drop policy if exists "Review owners can delete review tags" on public.review_tags;
create policy "Review owners can delete review tags"
on public.review_tags
for delete
to authenticated
using (
  public.current_profile_is_active()
  and exists (
    select 1
    from public.reviews
    where reviews.id = review_tags.review_id
      and reviews.user_id = (select auth.uid())
  )
);

drop policy if exists "Authenticated users can read tag categories" on public.tag_categories;
create policy "Authenticated users can read tag categories"
on public.tag_categories
for select
to authenticated
using (public.current_profile_is_active());

drop policy if exists "Authenticated users can read tags" on public.tags;
create policy "Authenticated users can read tags"
on public.tags
for select
to authenticated
using (public.current_profile_is_active());

drop policy if exists "Users can read their own place bookmarks" on public.place_bookmarks;
create policy "Users can read their own place bookmarks"
on public.place_bookmarks
for select
to authenticated
using (public.current_profile_is_active() and (select auth.uid()) = user_id);

drop policy if exists "Users can create their own place bookmarks" on public.place_bookmarks;
create policy "Users can create their own place bookmarks"
on public.place_bookmarks
for insert
to authenticated
with check (public.current_profile_is_active() and (select auth.uid()) = user_id);

drop policy if exists "Users can delete their own place bookmarks" on public.place_bookmarks;
create policy "Users can delete their own place bookmarks"
on public.place_bookmarks
for delete
to authenticated
using (public.current_profile_is_active() and (select auth.uid()) = user_id);

drop policy if exists "Users can read their own review likes" on public.review_likes;
create policy "Users can read their own review likes"
on public.review_likes
for select
to authenticated
using (public.current_profile_is_active() and (select auth.uid()) = user_id);

drop policy if exists "Users can create their own review likes" on public.review_likes;
create policy "Users can create their own review likes"
on public.review_likes
for insert
to authenticated
with check (public.current_profile_is_active() and (select auth.uid()) = user_id);

drop policy if exists "Users can delete their own review likes" on public.review_likes;
create policy "Users can delete their own review likes"
on public.review_likes
for delete
to authenticated
using (public.current_profile_is_active() and (select auth.uid()) = user_id);
