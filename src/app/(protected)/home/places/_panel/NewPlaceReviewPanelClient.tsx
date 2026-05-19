"use client";

import { useRouter } from "next/navigation";

import { ReviewForm } from "@/features/review/components/ReviewForm";
import type { ExistingReviewPlaceMatch } from "@/features/review/actions";
import type { TagGroup } from "@/features/tag/types";

import { buildPlacesHref, EXISTING_PLACE_REVIEW_PANEL, PLACE_DETAIL_PANEL } from "./panelLinks";

type NewPlaceReviewPanelClientProps = {
  tagGroups: TagGroup[];
  closeHref: string;
  page: number;
};

export function NewPlaceReviewPanelClient({
  tagGroups,
  closeHref,
  page,
}: NewPlaceReviewPanelClientProps) {
  const router = useRouter();
  const navigateToPlaceDetail = (placeId: string) => {
    router.replace(
      buildPlacesHref({
        page,
        panel: PLACE_DETAIL_PANEL,
        placeId,
      }),
      { scroll: false }
    );
  };
  const navigateToExistingPlaceReview = (place: ExistingReviewPlaceMatch) => {
    router.replace(
      buildPlacesHref({
        page,
        panel: EXISTING_PLACE_REVIEW_PANEL,
        placeId: place.id,
      }),
      { scroll: false }
    );
  };

  return (
    <ReviewForm
      mode="new-place"
      tagGroups={tagGroups}
      onClose={() => router.replace(closeHref, { scroll: false })}
      onSuccess={navigateToPlaceDetail}
      onExistingPlaceMatch={navigateToExistingPlaceReview}
    />
  );
}
