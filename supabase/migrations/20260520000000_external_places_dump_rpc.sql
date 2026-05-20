-- External API 向けに店舗情報と人気レビュータグをまとめて返す。
create or replace function public.get_external_places_dump()
returns table (
  id uuid,
  name text,
  google_place_id text,
  category text,
  avg_rating numeric,
  review_count integer,
  tags jsonb
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    places.id,
    places.name,
    places.google_place_id,
    places.category,
    places.avg_rating,
    places.review_count,
    coalesce(tag_summary.tags, '[]'::jsonb) as tags
  from public.places
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', ranked_tags.id,
        'name', ranked_tags.name,
        'emoji', ranked_tags.emoji,
        'count', ranked_tags.review_count
      )
      order by ranked_tags.review_count desc, ranked_tags.name asc, ranked_tags.id asc
    ) as tags
    from (
      select
        tags.id,
        tags.name,
        tags.emoji,
        count(*)::integer as review_count
      from public.reviews
      inner join public.review_tags
        on review_tags.review_id = reviews.id
      inner join public.tags
        on tags.id = review_tags.tag_id
      where reviews.place_id = places.id
      group by tags.id, tags.name, tags.emoji
      order by count(*) desc, tags.name asc, tags.id asc
      limit 5
    ) as ranked_tags
  ) as tag_summary on true
  order by places.name asc, places.id asc
$$;

revoke all on function public.get_external_places_dump() from public;
grant execute on function public.get_external_places_dump() to service_role;
