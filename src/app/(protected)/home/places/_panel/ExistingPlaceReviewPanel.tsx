import { Suspense } from "react";

import { MapMarkersSync } from "@/components/google-maps";
import { getPlaceAction } from "@/features/places/actions";
import { toPlaceMarker } from "@/features/places/placeMarkers";
import { getTagGroupsAction } from "@/features/tag/actions";

import { ExistingPlaceReviewPanelClient } from "./ExistingPlaceReviewPanelClient";
import { HomePanelFrame } from "../../_panel/HomePanelFrame";

type ExistingPlaceReviewPanelProps = {
  closeHref: string;
  detailHref: string;
  placeId: string;
};

function ExistingPlaceReviewLoading() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
        <div className="h-24 w-full animate-pulse rounded bg-slate-100" />
        <p className="text-sm text-slate-500">レビュー投稿フォームを読み込んでいます。</p>
      </div>
    </div>
  );
}

function ExistingPlaceReviewNotFound({ placeId }: { placeId: string }) {
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

async function ExistingPlaceReviewBody({
  detailHref,
  placeId,
}: Pick<ExistingPlaceReviewPanelProps, "detailHref" | "placeId">) {
  const [place, tagGroups] = await Promise.all([getPlaceAction(placeId), getTagGroupsAction()]);

  if (!place) {
    return <ExistingPlaceReviewNotFound placeId={placeId} />;
  }

  const marker = {
    ...toPlaceMarker(place),
    href: detailHref,
  };
  const reviewPlace = {
    id: place.id,
    googlePlaceId: place.googlePlaceId,
    name: place.name,
    address: null,
    lat: place.lat,
    lng: place.lng,
    category: place.category,
    imageUrl: place.imageUrl,
    photoAttributions: place.photoAttributions,
    distanceFromOfficeMeters: place.distanceFromOfficeMeters,
    walkingDurationSeconds: place.walkingDurationSeconds,
  };

  return (
    <>
      <MapMarkersSync source="place-detail" markers={[marker]} selectedMarkerId={place.id} />
      <ExistingPlaceReviewPanelClient
        detailHref={detailHref}
        place={reviewPlace}
        tagGroups={tagGroups}
      />
    </>
  );
}

export function ExistingPlaceReviewPanel({
  closeHref,
  detailHref,
  placeId,
}: ExistingPlaceReviewPanelProps) {
  return (
    <HomePanelFrame title="レビューを投稿" closeHref={closeHref}>
      <Suspense key={placeId} fallback={<ExistingPlaceReviewLoading />}>
        <ExistingPlaceReviewBody detailHref={detailHref} placeId={placeId} />
      </Suspense>
    </HomePanelFrame>
  );
}
