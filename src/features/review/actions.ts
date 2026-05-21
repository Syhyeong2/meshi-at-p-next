"use server";

import { revalidatePath } from "next/cache";

import { requireActiveUser } from "@/features/auth/access";
import {
  getGooglePlaceCategory,
  verifyGooglePlaceSelection,
  type SignedGooglePlaceDetails,
} from "@/features/places/googlePlaces";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export type SelectedReviewPlaceInput = SignedGooglePlaceDetails;

export type CreateReviewWithPlaceInput = {
  place: SelectedReviewPlaceInput;
  rating: number;
  priceRange: number | null;
  comment: string;
  visitDate: string | null;
  tagIds: string[];
};

export type CreateReviewForExistingPlaceInput = {
  placeId: string;
  rating: number;
  priceRange: number | null;
  comment: string;
  visitDate: string | null;
  tagIds: string[];
};

export type CreateReviewResult =
  | {
      success: true;
      placeId: string;
      reviewId: string;
    }
  | {
      success: false;
      error: string;
    };

export type CreateReviewWithPlaceResult = CreateReviewResult;
export type CreateReviewForExistingPlaceResult = CreateReviewResult;

export type ExistingReviewPlaceMatch = {
  id: string;
  name: string;
};

export type FindPlaceIdByGooglePlaceIdResult =
  | {
      success: true;
      place: ExistingReviewPlaceMatch | null;
    }
  | {
      success: false;
      error: string;
    };

export async function toggleReviewLikeAction(reviewId: string, shouldLike: boolean): Promise<void> {
  const user = await requireActiveUser();
  const normalizedReviewId = reviewId.trim();

  if (!normalizedReviewId) {
    throw new Error("レビューが見つかりませんでした。");
  }

  const supabase = await createClient();
  const { error } = shouldLike
    ? await supabase.from("review_likes").upsert(
        {
          user_id: user.userId,
          review_id: normalizedReviewId,
        },
        {
          onConflict: "user_id,review_id",
          ignoreDuplicates: true,
        }
      )
    : await supabase
        .from("review_likes")
        .delete()
        .eq("user_id", user.userId)
        .eq("review_id", normalizedReviewId);

  if (error) {
    throw new Error("いいねの更新に失敗しました。");
  }

  revalidatePath("/home/places");
}

function isRating(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

function isPriceRange(value: number | null): boolean {
  return value === null || (Number.isInteger(value) && value >= 1 && value <= 5);
}

function hasValidCoordinates(place: SelectedReviewPlaceInput): boolean {
  return Number.isFinite(place.lat) && Number.isFinite(place.lng);
}

function hasValidSelectedPlaceInput(
  place: SelectedReviewPlaceInput | undefined
): place is SelectedReviewPlaceInput {
  return Boolean(
    place?.googlePlaceId &&
    place.sessionToken &&
    place.selectionSignature &&
    place.name &&
    typeof place.primaryType === "string" &&
    place.primaryType &&
    place.category === getGooglePlaceCategory(place.primaryType) &&
    Array.isArray(place.types) &&
    Array.isArray(place.photoAttributions) &&
    hasValidCoordinates(place)
  );
}

function normalizeVisitDate(value: string | null): string | null {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

const REVIEW_SUBMISSION_ERROR = "レビューの投稿に失敗しました。";
const PLACE_NOT_FOUND_ERROR = "お店が見つかりませんでした。";

type ReviewSubmissionRpcRow = {
  place_id: string;
  review_id: string;
};

type ReviewSubmissionRpcError = {
  code?: string;
};

class ReviewSubmissionError extends Error {
  constructor(message = REVIEW_SUBMISSION_ERROR) {
    super(message);
    this.name = "ReviewSubmissionError";
  }
}

function normalizeTagIds(tagIds: string[]): string[] {
  return Array.from(new Set(tagIds.map((tagId) => tagId.trim()).filter(Boolean)));
}

function toPhotoAttributionsJson(
  photoAttributions: SelectedReviewPlaceInput["photoAttributions"]
): Json {
  return photoAttributions.map(
    (attribution): Json => ({
      displayName: attribution.displayName,
      uri: attribution.uri,
      photoUri: attribution.photoUri,
    })
  );
}

function getReviewSubmissionErrorMessage(error: ReviewSubmissionRpcError | null): string {
  if (error?.code === "P0002") {
    return PLACE_NOT_FOUND_ERROR;
  }

  return REVIEW_SUBMISSION_ERROR;
}

function toReviewSubmissionResult(
  data: ReviewSubmissionRpcRow[] | null,
  error: ReviewSubmissionRpcError | null
): { placeId: string; reviewId: string } {
  if (error) {
    throw new ReviewSubmissionError(getReviewSubmissionErrorMessage(error));
  }

  const review = data?.[0];

  if (!review?.place_id || !review.review_id) {
    throw new ReviewSubmissionError();
  }

  return {
    placeId: review.place_id,
    reviewId: review.review_id,
  };
}

function getCaughtReviewSubmissionMessage(error: unknown): string {
  return error instanceof ReviewSubmissionError ? error.message : REVIEW_SUBMISSION_ERROR;
}

function validateReviewInput(input: { rating: number; priceRange: number | null }): string | null {
  if (!isRating(input.rating)) {
    return "レートを選択してください。";
  }

  if (!isPriceRange(input.priceRange)) {
    return "価格帯を選択してください。";
  }

  return null;
}

export async function findPlaceIdByGooglePlaceIdAction(
  googlePlaceId: string
): Promise<FindPlaceIdByGooglePlaceIdResult> {
  await requireActiveUser();

  const normalizedGooglePlaceId = googlePlaceId.trim();

  if (!normalizedGooglePlaceId) {
    return { success: true, place: null };
  }

  try {
    const supabase = await createClient();
    const { data: place, error } = await supabase
      .from("places")
      .select("id, name")
      .eq("google_place_id", normalizedGooglePlaceId)
      .maybeSingle();

    if (error) {
      throw new Error("Failed to find place.");
    }

    return {
      success: true,
      place: place
        ? {
            id: place.id,
            name: place.name,
          }
        : null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "お店の情報を取得できませんでした。",
    };
  }
}

export async function createReviewWithPlaceAction(
  input: CreateReviewWithPlaceInput
): Promise<CreateReviewWithPlaceResult> {
  const user = await requireActiveUser();

  if (!input.place?.googlePlaceId || !input.place.sessionToken || !input.place.selectionSignature) {
    return { success: false, error: "お店を選択してください。" };
  }

  if (!hasValidSelectedPlaceInput(input.place)) {
    return { success: false, error: "お店の情報を取得できませんでした。" };
  }

  if (
    !verifyGooglePlaceSelection({
      details: input.place,
      sessionToken: input.place.sessionToken,
      selectionSignature: input.place.selectionSignature,
    })
  ) {
    return { success: false, error: "お店の情報を取得できませんでした。" };
  }

  const validationError = validateReviewInput(input);

  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("create_review_with_place_transaction", {
      p_user_id: user.userId,
      p_google_place_id: input.place.googlePlaceId,
      p_name: input.place.name,
      p_category: input.place.category,
      p_lat: input.place.lat,
      p_lng: input.place.lng,
      p_rating: input.rating,
      p_price_range: input.priceRange,
      p_comment: input.comment,
      p_visited_at: normalizeVisitDate(input.visitDate),
      p_tag_ids: normalizeTagIds(input.tagIds),
      p_image_url: input.place.imageUrl ?? null,
      p_photo_attributions: toPhotoAttributionsJson(input.place.photoAttributions),
      p_distance_from_office_meters: input.place.distanceFromOfficeMeters ?? null,
      p_walking_duration_seconds: input.place.walkingDurationSeconds ?? null,
    });
    const review = toReviewSubmissionResult(data, error);

    revalidatePath("/home/places");

    return {
      success: true,
      placeId: review.placeId,
      reviewId: review.reviewId,
    };
  } catch (error) {
    return {
      success: false,
      error: getCaughtReviewSubmissionMessage(error),
    };
  }
}

export async function createReviewForExistingPlaceAction(
  input: CreateReviewForExistingPlaceInput
): Promise<CreateReviewForExistingPlaceResult> {
  const user = await requireActiveUser();
  const placeId = input.placeId.trim();

  if (!placeId) {
    return { success: false, error: "お店を選択してください。" };
  }

  const validationError = validateReviewInput(input);

  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("create_review_for_existing_place_transaction", {
      p_user_id: user.userId,
      p_place_id: placeId,
      p_rating: input.rating,
      p_price_range: input.priceRange,
      p_comment: input.comment,
      p_visited_at: normalizeVisitDate(input.visitDate),
      p_tag_ids: normalizeTagIds(input.tagIds),
    });
    const review = toReviewSubmissionResult(data, error);

    revalidatePath("/home/places");

    return {
      success: true,
      placeId: review.placeId,
      reviewId: review.reviewId,
    };
  } catch (error) {
    return {
      success: false,
      error: getCaughtReviewSubmissionMessage(error),
    };
  }
}

export type UpdateReviewInput = Omit<CreateReviewForExistingPlaceInput, "placeId"> & {
  reviewId: string;
};

export type GetReviewForEditResult =
  | {
      success: true;
      review: Omit<UpdateReviewInput, "reviewId" | "visitDate"> & {
        id: string;
        visitedAt: string | null;
        placeId: string;
      };
    }
  | {
      success: false;
      error: string;
    };

export type UpdateReviewResult = CreateReviewResult;

export type DeleteReviewResult =
  | { success: true; placeId: string }
  | { success: false; error: string };

export async function updateReviewAction(input: UpdateReviewInput): Promise<UpdateReviewResult> {
  const user = await requireActiveUser();
  const reviewId = input.reviewId.trim();

  if (!reviewId) {
    return { success: false, error: "レビューが見つかりませんでした。" };
  }

  const validationError = validateReviewInput({
    rating: input.rating,
    priceRange: input.priceRange,
  });
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const supabase = await createClient();
    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("user_id, place_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (fetchError || !review) {
      throw new ReviewSubmissionError("レビューが見つかりませんでした。");
    }

    if (review.user_id !== user.userId) {
      throw new ReviewSubmissionError("自分が投稿したレビューのみ編集できます。");
    }

    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        rating: input.rating,
        price_range: input.priceRange,
        comment: input.comment.trim() || null,
        visited_at: normalizeVisitDate(input.visitDate),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (updateError) {
      throw new ReviewSubmissionError("レビューの更新に失敗しました。");
    }

    await supabase.from("review_tags").delete().eq("review_id", reviewId);

    const uniqueTagIds = normalizeTagIds(input.tagIds);
    if (uniqueTagIds.length > 0) {
      const { error: reviewTagsError } = await supabase.from("review_tags").insert(
        uniqueTagIds.map((tagId) => ({
          review_id: reviewId,
          tag_id: tagId,
        }))
      );

      if (reviewTagsError) {
        throw new ReviewSubmissionError("レビュータグの更新に失敗しました。");
      }
    }

    const admin = createAdminClient();
    const { data: reviews, error: reviewsError } = await admin
      .from("reviews")
      .select("rating")
      .eq("place_id", review.place_id);

    if (!reviewsError && reviews) {
      const reviewCount = reviews.length;
      const avgRating =
        reviewCount === 0
          ? 0
          : Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(2));

      await admin
        .from("places")
        .update({ avg_rating: avgRating, review_count: reviewCount })
        .eq("id", review.place_id);
    }

    revalidatePath("/home/places");

    return {
      success: true,
      placeId: review.place_id,
      reviewId: reviewId,
    };
  } catch (error) {
    return {
      success: false,
      error: getCaughtReviewSubmissionMessage(error),
    };
  }
}

export async function deleteReviewAction(reviewId: string): Promise<DeleteReviewResult> {
  const user = await requireActiveUser();
  const normalizedReviewId = reviewId.trim();

  if (!normalizedReviewId) {
    return { success: false, error: "レビューが見つかりませんでした。" };
  }

  try {
    const supabase = await createClient();

    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("user_id, place_id")
      .eq("id", normalizedReviewId)
      .maybeSingle();

    if (fetchError || !review) {
      throw new ReviewSubmissionError("レビューが見つかりませんでした。");
    }

    if (review.user_id !== user.userId) {
      throw new ReviewSubmissionError("自分が投稿したレビューのみ削除できます。");
    }

    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", normalizedReviewId);

    if (deleteError) {
      throw new ReviewSubmissionError("レビューの削除に失敗しました。");
    }

    const admin = createAdminClient();
    const { data: reviews, error: reviewsError } = await admin
      .from("reviews")
      .select("rating")
      .eq("place_id", review.place_id);

    if (!reviewsError && reviews) {
      const reviewCount = reviews.length;
      const avgRating =
        reviewCount === 0
          ? 0
          : Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(2));

      await admin
        .from("places")
        .update({ avg_rating: avgRating, review_count: reviewCount })
        .eq("id", review.place_id);
    }

    revalidatePath("/home/places");

    return {
      success: true,
      placeId: review.place_id,
    };
  } catch (error) {
    return {
      success: false,
      error: getCaughtReviewSubmissionMessage(error),
    };
  }
}

export async function getReviewForEditAction(reviewId: string): Promise<GetReviewForEditResult> {
  const user = await requireActiveUser();
  const normalizedReviewId = reviewId.trim();

  if (!normalizedReviewId) {
    return { success: false, error: "レビューIDが正しくありません。" };
  }

  try {
    const supabase = await createClient();

    const [reviewResult, tagsResult] = await Promise.all([
      supabase
        .from("reviews")
        .select("id, user_id, rating, price_range, comment, visited_at, place_id") // place_idも取る
        .eq("id", normalizedReviewId)
        .maybeSingle(),
      supabase.from("review_tags").select("tag_id").eq("review_id", normalizedReviewId),
    ]);

    if (reviewResult.error || !reviewResult.data) {
      throw new ReviewSubmissionError("レビューが見つかりませんでした。");
    }

    const reviewData = reviewResult.data;

    if (reviewData.user_id !== user.userId) {
      throw new ReviewSubmissionError("ご自身のレビュー以外は編集できません。");
    }

    const tagIds = tagsResult.data ? tagsResult.data.map((row) => row.tag_id) : [];

    return {
      success: true,
      review: {
        id: reviewData.id,
        rating: reviewData.rating,
        priceRange: reviewData.price_range,
        comment: reviewData.comment || "",
        visitedAt: reviewData.visited_at || null,
        tagIds,
        placeId: reviewData.place_id,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: getCaughtReviewSubmissionMessage(error),
    };
  }
}
