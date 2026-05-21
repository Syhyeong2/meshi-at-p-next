import { Suspense } from "react";

import { MapMarkersSync } from "@/components/google-maps";
import {
  getPlaceAction,
  getPlaceReviewAction,
  getPlaceReviewsAction,
} from "@/features/places/actions";
import { toPlaceMarker } from "@/features/places/placeMarkers";

import { HomePanelFrame } from "../../_panel/HomePanelFrame";
import { PlaceReviewsPanelClient } from "./PlaceReviewsPanelClient";

import { requireActiveUser } from "@/features/auth/access";

type PlaceReviewsPanelProps = {
  basePath: string;
  closeHref: string;
  detailHref: string;
  initialReviewId?: string;
  placeId: string;
  reviewsHref: string;
  editHrefTemplate: (reviewId: string) => string;
};

function PlaceReviewsLoading() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
        <div className="h-24 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-24 w-full animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

function PlaceReviewsNotFound({ placeId }: { placeId: string }) {
  return (
    <>
      <MapMarkersSync source="place-detail" markers={[]} selectedMarkerId={null} />
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
        <div>
          <p>お店が見つかりませんでした。</p>
          <p className="mt-2 break-all">ID: {placeId}</p>
        </div>
      </div>
    </>
  );
}

async function PlaceReviewsBody({
  basePath,
  detailHref,
  initialReviewId,
  placeId,
  reviewsHref,
  editHrefTemplate,
}: Pick<
  PlaceReviewsPanelProps,
  | "basePath"
  | "detailHref"
  | "initialReviewId"
  | "placeId"
  | "reviewsHref"
  | "editHrefTemplate"
>) {
  const [place, reviewsPage, selectedReview, user] = await Promise.all([
    getPlaceAction(placeId),
    getPlaceReviewsAction(placeId),
    initialReviewId ? getPlaceReviewAction(placeId, initialReviewId) : Promise.resolve(null),
    requireActiveUser(),
  ]);

  const currentUserId = user.userId;

  if (!place) {
    return <PlaceReviewsNotFound placeId={placeId} />;
  }

  const marker = {
    ...toPlaceMarker(place),
    href: detailHref,
  };

  return (
    <>
      <MapMarkersSync source="place-detail" markers={[marker]} selectedMarkerId={place.id} />
      <PlaceReviewsPanelClient
        basePath={basePath}
        detailHref={detailHref}
        hasMore={reviewsPage.hasMore}
        initialReviewId={initialReviewId}
        initialSelectedReview={selectedReview}
        nextOffset={reviewsPage.nextOffset}
        placeName={place.name}
        placeId={place.id}
        reviews={reviewsPage.reviews}
        reviewsHref={reviewsHref}
        totalReviewCount={place.reviewCount}
        currentUserId={currentUserId}
        editHrefTemplate={editHrefTemplate("__REVIEW_ID__")}
      />
    </>
  );
}

export function PlaceReviewsPanel({
  basePath,
  closeHref,
  detailHref,
  initialReviewId,
  placeId,
  reviewsHref,
  editHrefTemplate,
}: PlaceReviewsPanelProps) {
  return (
    <HomePanelFrame title="社員レビュー" closeHref={closeHref}>
      <Suspense key={`${placeId}:${initialReviewId ?? ""}`} fallback={<PlaceReviewsLoading />}>
        <PlaceReviewsBody
          basePath={basePath}
          detailHref={detailHref}
          initialReviewId={initialReviewId}
          placeId={placeId}
          reviewsHref={reviewsHref}
          editHrefTemplate={editHrefTemplate}
        />
      </Suspense>
    </HomePanelFrame>
  );
}
