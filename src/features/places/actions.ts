"use server";

import {
  fetchGooglePlaceBusinessDetails,
  type GooglePlacePhotoAttribution,
} from "@/features/places/googlePlaces";
import { getPlacePopularReviewTags } from "@/features/places/placeReviewInsights";
import type {
  Place,
  PlaceGoogleBusinessDetails,
  PlacePopularReviewTag,
  PlaceReview,
  PlaceReviewPreview,
} from "@/features/places/types";
import { requireActiveUser } from "@/features/auth/access";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const PLACES_SELECT_COLUMNS = `
  id,
  google_place_id,
  name,
  category,
  price_range,
  lat,
  lng,
  image_url,
  photo_attributions,
  is_gochimeshi,
  avg_rating,
  review_count,
  distance_from_office_meters,
  walking_duration_seconds,
  place_bookmarks!left(user_id)
`;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const POPULAR_REVIEW_TAGS_LIMIT = 4;
const PLACE_REVIEW_PREVIEWS_LIMIT = 3;
const REVIEW_PAGE_SIZE = 10;
const PLACE_REVIEW_SELECT_COLUMNS = `
  id,
  user_id,
  rating,
  price_range,
  comment,
  created_at,
  visited_at,
  profiles!reviews_user_id_fkey (
    nickname
  )
`;

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

type GetPlacesActionParams = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  rating?: number;
  price?: number | null;
  categories?: string[];
  tags?: string[];
  isGochimeshi?: boolean;
  sort?: PlaceSort;
};

type PlacesQueryFilters = Pick<
  GetPlacesActionParams,
  "keyword" | "rating" | "price" | "categories" | "tags" | "isGochimeshi"
>;

type PlacesSelectOptions = {
  count?: "exact";
  head?: boolean;
};

type GetPlaceReviewsActionParams = {
  offset?: number;
  limit?: number;
  sort?: PlaceReviewSort;
};

export type PlaceReviewSort = "latest" | "rating";
export type PlaceSort = "rating" | "review_count" | "distance";

type PlacesPagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

type GetPlacesActionResult = {
  places: Place[];
  pagination: PlacesPagination;
};

export type GetPlaceReviewsActionResult = {
  reviews: PlaceReview[];
  hasMore: boolean;
  nextOffset: number;
};

type ReviewPreviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
} & ReviewAuthorRow;

type PlaceReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  price_range: number | null;
  comment: string | null;
  created_at: string;
  visited_at: string | null;
} & ReviewAuthorRow;

type ReviewAuthorRow = {
  profiles: EmbeddedReviewProfile | EmbeddedReviewProfile[] | null;
};

type EmbeddedReviewProfile = {
  nickname: string | null;
};

type ReviewTagRow = {
  review_id: string;
  tags: EmbeddedReviewTag | EmbeddedReviewTag[] | null;
};

type EmbeddedReviewTag = {
  name: string | null;
  emoji: string | null;
};

type ReviewLikeRow = {
  review_id: string;
  user_id: string;
};

type PlaceRow = {
  id: string;
  google_place_id: string;
  name: string;
  category: string | null;
  price_range: number | null;
  lat: number;
  lng: number;
  image_url: string | null;
  photo_attributions: Json;
  is_gochimeshi: boolean;
  avg_rating: number;
  review_count: number;
  distance_from_office_meters: number | null;
  walking_duration_seconds: number | null;
  place_bookmarks?: { user_id: string }[] | { user_id: string } | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && value && value > 0 ? value : fallback;
}

function normalizeNonNegativeInteger(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && value !== undefined && value >= 0 ? value : fallback;
}

function normalizePlaceSort(value: PlaceSort | undefined): PlaceSort {
  return value === "review_count" || value === "distance" ? value : "rating";
}

function getPlacesSelectColumns(tags?: string[]): string {
  return tags && tags.length > 0
    ? `${PLACES_SELECT_COLUMNS}, reviews!inner(review_tags!inner(tag_id))`
    : PLACES_SELECT_COLUMNS;
}

function buildPlacesQuery(
  supabase: SupabaseServerClient,
  { keyword, rating, price, categories, tags, isGochimeshi }: PlacesQueryFilters,
  selectOptions?: PlacesSelectOptions
) {
  let query = supabase.from("places").select(getPlacesSelectColumns(tags), selectOptions);

  if (keyword && keyword.trim() !== "") {
    query = query.ilike("name", `%${keyword.trim()}%`);
  }

  if (rating && rating > 0) {
    query = query.gte("avg_rating", rating);
  }
  if (price !== undefined && price !== null) {
    query = query.eq("price_range", price);
  }
  if (categories && categories.length > 0) {
    query = query.in("category", categories);
  }
  if (isGochimeshi === true) {
    query = query.eq("is_gochimeshi", true);
  }
  if (tags && tags.length > 0) {
    query = query.in("reviews.review_tags.tag_id", tags);
  }

  return query;
}

function toPhotoAttributions(value: Json): GooglePlacePhotoAttribution[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((attribution): GooglePlacePhotoAttribution | null => {
      if (
        !attribution ||
        typeof attribution !== "object" ||
        Array.isArray(attribution) ||
        typeof attribution.displayName !== "string"
      ) {
        return null;
      }

      return {
        displayName: attribution.displayName,
        uri: typeof attribution.uri === "string" ? attribution.uri : null,
        photoUri: typeof attribution.photoUri === "string" ? attribution.photoUri : null,
      };
    })
    .filter((attribution): attribution is GooglePlacePhotoAttribution => attribution !== null);
}

function toPlace(place: PlaceRow, currentUserId?: string): Place {
  const bookmarks = Array.isArray(place.place_bookmarks)
    ? place.place_bookmarks
    : place.place_bookmarks
      ? [place.place_bookmarks]
      : [];

  return {
    id: place.id,
    googlePlaceId: place.google_place_id,
    name: place.name,
    category: place.category,
    price_range: place.price_range,
    lat: place.lat,
    lng: place.lng,
    imageUrl: place.image_url,
    photoAttributions: toPhotoAttributions(place.photo_attributions),
    isGochimeshi: place.is_gochimeshi,
    avgRating: place.avg_rating,
    reviewCount: place.review_count,
    distanceFromOfficeMeters: place.distance_from_office_meters,
    walkingDurationSeconds: place.walking_duration_seconds,
    isBookmarked: currentUserId ? bookmarks.some((b) => b.user_id === currentUserId) : false,
    bookmarkCount: bookmarks.length,
  };
}

async function fetchNullableGoogleBusinessDetails(
  googlePlaceId: string
): Promise<PlaceGoogleBusinessDetails | null> {
  try {
    return await fetchGooglePlaceBusinessDetails(googlePlaceId);
  } catch {
    return null;
  }
}

function getReviewAuthorName(row: ReviewAuthorRow): string {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  return profile?.nickname ?? "社員";
}

function getReviewTagLabel(row: ReviewTagRow): string | null {
  const tag = Array.isArray(row.tags) ? row.tags[0] : row.tags;
  const name = tag?.name?.trim();

  if (!name) {
    return null;
  }

  return tag?.emoji ? `${tag.emoji} ${name}` : name;
}

async function hydratePlaceReviews(
  admin: SupabaseAdminClient,
  userId: string,
  reviewRows: PlaceReviewRow[]
): Promise<PlaceReview[]> {
  if (reviewRows.length === 0) {
    return [];
  }

  const reviewIds = reviewRows.map((review) => review.id);
  const [reviewTagsResult, reviewLikesResult] = await Promise.all([
    admin
      .from("review_tags")
      .select(
        `
          review_id,
          tags!review_tags_tag_id_fkey (
            name,
            emoji
          )
        `
      )
      .in("review_id", reviewIds),
    admin.from("review_likes").select("review_id, user_id").in("review_id", reviewIds),
  ]);

  if (reviewTagsResult.error) {
    throw new Error("Failed to load review tags.");
  }

  if (reviewLikesResult.error) {
    throw new Error("Failed to load review likes.");
  }

  const tagsByReviewId = new Map<string, string[]>();
  const likeCountsByReviewId = new Map<string, number>();
  const likedReviewIds = new Set<string>();

  for (const reviewTag of (reviewTagsResult.data ?? []) as ReviewTagRow[]) {
    const tagLabel = getReviewTagLabel(reviewTag);

    if (!tagLabel) {
      continue;
    }

    const tags = tagsByReviewId.get(reviewTag.review_id) ?? [];

    tags.push(tagLabel);
    tagsByReviewId.set(reviewTag.review_id, tags);
  }

  for (const like of (reviewLikesResult.data ?? []) as ReviewLikeRow[]) {
    likeCountsByReviewId.set(like.review_id, (likeCountsByReviewId.get(like.review_id) ?? 0) + 1);

    if (like.user_id === userId) {
      likedReviewIds.add(like.review_id);
    }
  }

  return reviewRows.map((review) => ({
    id: review.id,
    authorId: review.user_id,
    authorName: getReviewAuthorName(review),
    rating: review.rating,
    priceRange: review.price_range,
    comment: review.comment?.trim() || "",
    date: review.created_at,
    visitDate: review.visited_at,
    tags: tagsByReviewId.get(review.id) ?? [],
    initialLikeCount: likeCountsByReviewId.get(review.id) ?? 0,
    initialIsLiked: likedReviewIds.has(review.id),
  }));
}

export async function getPlacesAction({
  page,
  pageSize,
  keyword,
  rating,
  price,
  categories,
  tags,
  isGochimeshi,
  sort,
}: GetPlacesActionParams = {}): Promise<GetPlacesActionResult> {
  const normalizedPage = normalizePositiveInteger(page, DEFAULT_PAGE);
  const normalizedPageSize = normalizePositiveInteger(pageSize, DEFAULT_PAGE_SIZE);
  const normalizedSort = normalizePlaceSort(sort);
  const supabase = await createClient();
  const filters = {
    keyword,
    rating,
    price,
    categories,
    tags,
    isGochimeshi,
  };

  const { error: countError, count } = await buildPlacesQuery(supabase, filters, {
    count: "exact",
    head: true,
  });

  if (countError) {
    console.error("【Supabaseデバッグ】エラーの全貌:", countError);
    throw new Error("Failed to load places.");
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / normalizedPageSize));
  const safePage = Math.min(normalizedPage, totalPages);
  const from = (safePage - 1) * normalizedPageSize;
  const to = from + normalizedPageSize - 1;

  let query = buildPlacesQuery(supabase, filters);

  if (normalizedSort === "review_count") {
    query = query
      .order("review_count", { ascending: false })
      .order("avg_rating", { ascending: false });
  } else if (normalizedSort === "distance") {
    query = query
      .order("distance_from_office_meters", { ascending: true, nullsFirst: false })
      .order("avg_rating", { ascending: false });
  } else {
    query = query
      .order("avg_rating", { ascending: false })
      .order("review_count", { ascending: false });
  }

  const { data, error } = await query.order("id", { ascending: true }).range(from, to);

  if (error) {
    console.error("【Supabaseデバッグ】エラーの全貌:", error);
    throw new Error("Failed to load places.");
  }

  const { userId } = await requireActiveUser();
  const placeRows = (data ?? []) as unknown as PlaceRow[];

  return {
    places: placeRows.map((p) => toPlace(p, userId)),
    pagination: {
      page: safePage,
      pageSize: normalizedPageSize,
      totalCount,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages,
    },
  };
}

export async function getPlaceAction(placeId: string): Promise<Place | null> {
  const normalizedPlaceId = placeId.trim();

  if (!normalizedPlaceId) {
    return null;
  }

  const { userId } = await requireActiveUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("places")
    .select(PLACES_SELECT_COLUMNS)
    .eq("id", normalizedPlaceId)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to load place.");
  }

  return data ? toPlace(data, userId) : null;
}

export async function getPlacePopularReviewTagsAction(
  placeId: string
): Promise<PlacePopularReviewTag[]> {
  const normalizedPlaceId = placeId.trim();

  if (!normalizedPlaceId) {
    return [];
  }

  const supabase = await createClient();

  return getPlacePopularReviewTags(supabase, normalizedPlaceId, POPULAR_REVIEW_TAGS_LIMIT);
}

export async function getPlaceReviewPreviewsAction(placeId: string): Promise<PlaceReviewPreview[]> {
  const normalizedPlaceId = placeId.trim();

  if (!normalizedPlaceId) {
    return [];
  }

  await requireActiveUser();

  const admin = createAdminClient();
  const { data: reviews, error: reviewsError } = await admin
    .from("reviews")
    .select(
      `
        id,
        rating,
        comment,
        created_at,
        profiles!reviews_user_id_fkey (
          nickname
        )
      `
    )
    .eq("place_id", normalizedPlaceId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(PLACE_REVIEW_PREVIEWS_LIMIT);

  if (reviewsError) {
    throw new Error("Failed to load review previews.");
  }

  const reviewRows = (reviews ?? []) as ReviewPreviewRow[];

  return reviewRows.map((review) => ({
    id: review.id,
    authorName: getReviewAuthorName(review),
    rating: review.rating,
    comment: review.comment?.trim() || "",
    date: review.created_at,
  }));
}

export async function getPlaceReviewAction(
  placeId: string,
  reviewId: string
): Promise<PlaceReview | null> {
  const normalizedPlaceId = placeId.trim();
  const normalizedReviewId = reviewId.trim();

  if (!normalizedPlaceId || !normalizedReviewId) {
    return null;
  }

  const user = await requireActiveUser();
  const admin = createAdminClient();
  const { data: review, error: reviewError } = await admin
    .from("reviews")
    .select(PLACE_REVIEW_SELECT_COLUMNS)
    .eq("place_id", normalizedPlaceId)
    .eq("id", normalizedReviewId)
    .maybeSingle();

  if (reviewError) {
    throw new Error("Failed to load place review.");
  }

  if (!review) {
    return null;
  }

  const [placeReview] = await hydratePlaceReviews(admin, user.userId, [review as PlaceReviewRow]);

  return placeReview ?? null;
}

export async function getPlaceReviewsAction(
  placeId: string,
  { offset, limit, sort }: GetPlaceReviewsActionParams = {}
): Promise<GetPlaceReviewsActionResult> {
  const normalizedPlaceId = placeId.trim();

  if (!normalizedPlaceId) {
    return {
      reviews: [],
      hasMore: false,
      nextOffset: 0,
    };
  }

  const normalizedOffset = normalizeNonNegativeInteger(offset, 0);
  const normalizedLimit = normalizePositiveInteger(limit, REVIEW_PAGE_SIZE);
  const normalizedSort: PlaceReviewSort = sort === "rating" ? "rating" : "latest";
  const user = await requireActiveUser();
  const admin = createAdminClient();
  let reviewsQuery = admin
    .from("reviews")
    .select(PLACE_REVIEW_SELECT_COLUMNS)
    .eq("place_id", normalizedPlaceId);

  reviewsQuery =
    normalizedSort === "rating"
      ? reviewsQuery
          .order("rating", { ascending: false })
          .order("created_at", { ascending: false })
          .order("id", { ascending: true })
      : reviewsQuery.order("created_at", { ascending: false }).order("id", { ascending: true });

  const { data: reviews, error: reviewsError } = await reviewsQuery.range(
    normalizedOffset,
    normalizedOffset + normalizedLimit
  );

  if (reviewsError) {
    throw new Error("Failed to load place reviews.");
  }

  const fetchedReviewRows = (reviews ?? []) as PlaceReviewRow[];
  const hasMore = fetchedReviewRows.length > normalizedLimit;
  const reviewRows = fetchedReviewRows.slice(0, normalizedLimit);

  if (reviewRows.length === 0) {
    return {
      reviews: [],
      hasMore: false,
      nextOffset: normalizedOffset,
    };
  }

  const placeReviews = await hydratePlaceReviews(admin, user.userId, reviewRows);

  return {
    reviews: placeReviews,
    hasMore,
    nextOffset: normalizedOffset + reviewRows.length,
  };
}

export async function getPlaceGoogleBusinessDetailsAction(
  placeId: string
): Promise<PlaceGoogleBusinessDetails | null> {
  const normalizedPlaceId = placeId.trim();

  if (!normalizedPlaceId) {
    return null;
  }

  const supabase = await createClient();
  const { data: place, error } = await supabase
    .from("places")
    .select("google_place_id")
    .eq("id", normalizedPlaceId)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to load place Google Place ID.");
  }

  if (!place?.google_place_id) {
    return null;
  }

  return fetchNullableGoogleBusinessDetails(place.google_place_id);
}

export async function toggleBookmarkAction(placeId: string, isBookmarked: boolean) {
  const { userId } = await requireActiveUser();
  const supabase = await createClient();

  if (isBookmarked) {
    // 解除
    const { error } = await supabase
      .from("place_bookmarks")
      .delete()
      .eq("place_id", placeId)
      .eq("user_id", userId);

    if (error) {
      throw new Error("Failed to remove bookmark.");
    }
  } else {
    // 登録
    const { error } = await supabase
      .from("place_bookmarks")
      .insert({ place_id: placeId, user_id: userId });

    if (error && error.code !== "23505") {
      // 23505: unique_violation
      throw new Error("Failed to add bookmark.");
    }
  }

  // 即時削除を避けるため、特定のページの再検証は行わない（クライアント側の状態管理でUIを更新し、リフレッシュ時に反映させる）
  // 即時削除を避けるため、特定のページの再検証は行わない（クライアント側の状態管理でUIを更新し、リフレッシュ時に反映させる）
  revalidatePath("/home/places", "page");
  revalidatePath("/home/bookmarks", "page");
}

export async function getBookmarkedPlacesAction(limit?: number): Promise<Place[]> {
  const { userId } = await requireActiveUser();
  const supabase = await createClient();

  let query = supabase
    .from("places")
    .select(
      `
        *, 
        place_bookmarks!inner(user_id, created_at)
      `
    )
    .eq("place_bookmarks.user_id", userId)
    .order("created_at", { foreignTable: "place_bookmarks", ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load bookmarked places:", error);
    throw new Error("Failed to load bookmarked places.");
  }

  return data.map((p) => toPlace(p, userId));
}
