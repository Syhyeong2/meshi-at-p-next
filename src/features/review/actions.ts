"use server";

import { revalidatePath } from "next/cache";

import { requireActiveUser } from "@/features/auth/access";
import {
  getGooglePlaceCategory,
  verifyGooglePlaceSelection,
  type GooglePlaceDetails,
  type SignedGooglePlaceDetails,
} from "@/features/places/googlePlaces";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

async function upsertPlaceFromGoogleDetails(details: GooglePlaceDetails): Promise<string> {
  const admin = createAdminClient();
  const { data: place, error } = await admin
    .from("places")
    .upsert(
      {
        google_place_id: details.googlePlaceId,
        name: details.name,
        category: details.category,
        lat: details.lat,
        lng: details.lng,
        image_url: details.imageUrl,
        photo_attributions: details.photoAttributions,
        distance_from_office_meters: details.distanceFromOfficeMeters,
        walking_duration_seconds: details.walkingDurationSeconds,
      },
      {
        onConflict: "google_place_id",
      }
    )
    .select("id")
    .single();

  if (error) {
    throw new Error("Failed to save place.");
  }

  return place.id;
}

async function refreshPlaceRating(placeId: string) {
  const admin = createAdminClient();
  const { data: reviews, error: reviewsError } = await admin
    .from("reviews")
    .select("rating")
    .eq("place_id", placeId);

  if (reviewsError) {
    throw new Error("Failed to recalculate place rating.");
  }

  const reviewCount = reviews.length;
  const avgRating =
    reviewCount === 0
      ? 0
      : Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount).toFixed(2));

  const { error: placeError } = await admin
    .from("places")
    .update({
      avg_rating: avgRating,
      review_count: reviewCount,
    })
    .eq("id", placeId);

  if (placeError) {
    throw new Error("Failed to update place rating.");
  }
}

async function deleteReview(reviewId: string) {
  const supabase = await createClient();

  await supabase.from("reviews").delete().eq("id", reviewId);
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

async function createReviewForPlace({
  userId,
  placeId,
  rating,
  priceRange,
  comment,
  visitDate,
  tagIds,
}: {
  userId: string;
  placeId: string;
  rating: number;
  priceRange: number | null;
  comment: string;
  visitDate: string | null;
  tagIds: string[];
}): Promise<{ placeId: string; reviewId: string }> {
  const supabase = await createClient();
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .insert({
      user_id: userId,
      place_id: placeId,
      rating,
      price_range: priceRange,
      comment: comment.trim() || null,
      visited_at: normalizeVisitDate(visitDate),
    })
    .select("id")
    .single();

  if (reviewError) {
    throw new Error("Failed to create review.");
  }

  const uniqueTagIds = Array.from(new Set(tagIds.filter(Boolean)));

  if (uniqueTagIds.length > 0) {
    const { error: reviewTagsError } = await supabase.from("review_tags").insert(
      uniqueTagIds.map((tagId) => ({
        review_id: review.id,
        tag_id: tagId,
      }))
    );

    if (reviewTagsError) {
      await deleteReview(review.id);
      throw new Error("Failed to create review tags.");
    }
  }

  await refreshPlaceRating(placeId);
  revalidatePath("/home/places");

  return {
    placeId,
    reviewId: review.id,
  };
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
    const placeId = await upsertPlaceFromGoogleDetails(input.place);
    const review = await createReviewForPlace({
      userId: user.userId,
      placeId,
      rating: input.rating,
      priceRange: input.priceRange,
      comment: input.comment,
      visitDate: input.visitDate,
      tagIds: input.tagIds,
    });

    return {
      success: true,
      placeId: review.placeId,
      reviewId: review.reviewId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "レビューの投稿に失敗しました。",
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
    const supabase = await createClient();
    const { data: place, error: placeError } = await supabase
      .from("places")
      .select("id")
      .eq("id", placeId)
      .maybeSingle();

    if (placeError) {
      throw new Error("Failed to load place.");
    }

    if (!place) {
      return { success: false, error: "お店が見つかりませんでした。" };
    }

    const review = await createReviewForPlace({
      userId: user.userId,
      placeId: place.id,
      rating: input.rating,
      priceRange: input.priceRange,
      comment: input.comment,
      visitDate: input.visitDate,
      tagIds: input.tagIds,
    });

    return {
      success: true,
      placeId: review.placeId,
      reviewId: review.reviewId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "レビューの投稿に失敗しました。",
    };
  }
}
