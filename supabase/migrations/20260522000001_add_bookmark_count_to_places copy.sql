-- places テーブルに bookmark_count カラムを追加
alter table public.places add column if not exists bookmark_count integer not null default 0;

-- 既存のブックマーク数を集計して更新する関数
create or replace function public.refresh_place_bookmark_count(p_place_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.places
  set bookmark_count = (
    select count(*)
    from public.place_bookmarks
    where place_bookmarks.place_id = p_place_id
  )
  where places.id = p_place_id;
end;
$$;

-- 初期化として既存のデータを更新
do $$
declare
  v_place_id uuid;
begin
  for v_place_id in select id from public.places loop
    perform public.refresh_place_bookmark_count(v_place_id);
  end loop;
end;
$$;

-- ブックマーク作成/削除時に呼び出すトリガー関数
create or replace function public.handle_place_bookmark_count_change()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.places
  set bookmark_count = (
    select count(*)
    from public.place_bookmarks
    where place_bookmarks.place_id = coalesce(new.place_id, old.place_id)
  )
  where places.id = coalesce(new.place_id, old.place_id);

  return null;
end;
$$;

-- トリガーの作成
create trigger trg_place_bookmark_count_change
after insert or delete on public.place_bookmarks
for each row execute function public.handle_place_bookmark_count_change();
