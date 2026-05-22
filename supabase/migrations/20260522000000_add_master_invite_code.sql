-- Add a reusable master invite code for temporary open signup.

insert into public.invite_codes (
  code,
  expires_at
)
values (
  'MASTER_INVITE',
  '2099-12-31 00:00:00+00'::timestamptz
)
on conflict (code) do update
set
  used_at = null,
  used_by = null,
  expires_at = excluded.expires_at;

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
  if p_code = 'MASTER_INVITE' then
    if not exists (
      select 1
      from public.invite_codes
      where invite_codes.code = p_code
        and invite_codes.expires_at > v_used_at
    ) then
      raise exception 'invite_code_unavailable' using errcode = 'P0001';
    end if;

    insert into public.profiles (id, nickname)
    values (p_user_id, p_nickname);

    return;
  end if;

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
