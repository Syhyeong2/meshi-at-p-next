import { HomePanelFrame } from "../../_panel/HomePanelFrame";
import { getReviewForEditAction } from "@/features/review/actions";
import { getPlaceAction } from "@/features/places/actions";
import { getTagGroupsAction } from "@/features/tag/actions";

import { EditPlaceReviewClient } from "./EditPlaceReviewPanelClient";

type EditPlaceReviewPanelProps = {
  closeHref: string;
  placeId?: string;
  reviewId: string;
};

export async function EditPlaceReviewPanel({
  closeHref,
  placeId: initialPlaceId,
  reviewId,
}: EditPlaceReviewPanelProps) {
  const [reviewResult, tagGroups] = await Promise.all([
    getReviewForEditAction(reviewId),
    getTagGroupsAction(),
  ]);

  if (!reviewResult.success) {
    return (
      <HomePanelFrame title="レビューの編集" closeHref={closeHref}>
        <div className="flex-1 p-6 text-center font-bold text-red-500">{reviewResult.error}</div>
      </HomePanelFrame>
    );
  }

  const placeId = reviewResult.review.placeId || initialPlaceId;

  if (!placeId) {
    return (
      <HomePanelFrame title="レビューの編集" closeHref={closeHref}>
        <div className="flex-1 p-6 text-center font-bold text-red-500">
          お店のデータが見つかりませんでした。
        </div>
      </HomePanelFrame>
    );
  }

  const place = await getPlaceAction(placeId);

  if (!place) {
    return (
      <HomePanelFrame title="レビューの編集" closeHref={closeHref}>
        <div className="flex-1 p-6 text-center font-bold text-red-500">
          お店のデータが見つかりませんでした。
        </div>
      </HomePanelFrame>
    );
  }

  const initialReviewData = {
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
    visitDate: reviewResult.review.visitedAt ? new Date(reviewResult.review.visitedAt) : undefined,
    tagIds: reviewResult.review.tagIds,
  };

  return (
    <HomePanelFrame title="レビューの編集" closeHref={closeHref}>
      <EditPlaceReviewClient
        initialReviewData={initialReviewData}
        tagGroups={tagGroups ?? []}
        closeHref={closeHref}
      />
    </HomePanelFrame>
  );
}
