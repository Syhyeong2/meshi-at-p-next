"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { HomePanelFrame } from "../../_panel/HomePanelFrame";
import { ReviewForm } from "@/features/review/components/ReviewForm";

import { getReviewForEditAction } from "@/features/review/actions";
import { getPlaceAction } from "@/features/places/actions";
import { getTagGroupsAction } from "@/features/tag/actions";
import { type TagGroup } from "@/features/tag/types";
import { type ReviewFormPlaceInfo } from "@/features/review/hooks/useReviewForm";

type EditPlaceReviewPanelProps = {
  closeHref: string;
  placeId: string;
  reviewId: string;
};

export function EditPlaceReviewPanel({ closeHref, placeId, reviewId }: EditPlaceReviewPanelProps) {
  const router = useRouter();

  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initialReviewData, setInitialReviewData] = useState<ReviewFormPlaceInfo | null>(null);

  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);

  useEffect(() => {
    async function fetchFormRequiredData() {
      setInitialLoading(true);
      const [reviewResult, place, loadedTagGroups] = await Promise.all([
        getReviewForEditAction(reviewId),
        getPlaceAction(placeId),
        getTagGroupsAction(),
      ]);

      if (reviewResult.success && place) {
        if (loadedTagGroups) setTagGroups(loadedTagGroups);
        setInitialReviewData({
          id: place.id,
          googlePlaceId: place.googlePlaceId,
          name: place.name,
          address: null,
          imageUrl: place.imageUrl,
          avgRating: place.avgRating,
          reviewCount: place.reviewCount,
          category: place.category,
          distanceFromOfficeMeters: place.distanceFromOfficeMeters,
          walkingDurationSeconds: place.walkingDurationSeconds,

          reviewId: reviewId,
          rating: reviewResult.review.rating,
          comment: reviewResult.review.comment,
          price_range: reviewResult.review.priceRange,
          visitDate: reviewResult.review.visitedAt
            ? new Date(reviewResult.review.visitedAt)
            : undefined,
          tagIds: reviewResult.review.tagIds,
        });
      } else {
        setErrorMessage(
          reviewResult.success ? "お店のデータが見つかりませんでした。" : reviewResult.error
        );
      }
      setInitialLoading(false);
    }
    fetchFormRequiredData();
  }, [reviewId, placeId]);

  return (
    <HomePanelFrame title="レビューの編集" closeHref={closeHref}>
      <div className="flex h-full flex-col overflow-y-auto bg-white">
        {initialLoading && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <p className="text-xs text-slate-400">編集データを完全同期中...</p>
          </div>
        )}

        {!initialLoading && errorMessage && (
          <div className="flex-1 p-6 text-center font-bold text-red-500">{errorMessage}</div>
        )}

        {!initialLoading && !errorMessage && initialReviewData && (
          <ReviewForm
            mode="edit"
            place={initialReviewData}
            tagGroups={tagGroups}
            onClose={() => router.push(closeHref)}
            onSuccess={() => router.push(closeHref)}
          />
        )}
      </div>
    </HomePanelFrame>
  );
}
