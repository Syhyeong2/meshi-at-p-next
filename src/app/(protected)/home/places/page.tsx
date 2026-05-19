import Link from "next/link";
import { Plus } from "lucide-react";

import { MapMarkersSync } from "@/components/google-maps";
import { Button } from "@/components/ui/Button";
import { getPlacesAction } from "@/features/places/actions";
import { PlacesList } from "@/features/places/components/PlacesList";
import { PlacesPagination } from "@/features/places/components/PlacesPagination";
import { toPlaceMarkers } from "@/features/places/placeMarkers";

import { ExistingPlaceReviewPanel } from "./_panel/ExistingPlaceReviewPanel";
import { NewPlaceReviewPanel } from "./_panel/NewPlaceReviewPanel";
import { PlaceDetailPanel } from "./_panel/PlaceDetailPanel";
import {
  buildPlacesHref,
  EXISTING_PLACE_REVIEW_PANEL,
  NEW_PLACE_REVIEW_PANEL,
  PLACE_DETAIL_PANEL,
} from "./_panel/panelLinks";

const PLACES_PAGE_SIZE = 20;

type SearchParamValue = string | string[] | undefined;

type ExplorePageProps = {
  searchParams: Promise<{
    page?: SearchParamValue;
    panel?: SearchParamValue;
    placeId?: SearchParamValue;
  }>;
};

function getFirstParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePageParam(value: SearchParamValue): number {
  const parsedPage = Number(getFirstParam(value));

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { page, panel, placeId } = await searchParams;
  const requestedPage = parsePageParam(page);
  const panelName = getFirstParam(panel);
  const selectedPlaceId = getFirstParam(placeId);
  const isNewPlaceReviewPanel = panelName === NEW_PLACE_REVIEW_PANEL;
  const isPlaceDetailPanel = panelName === PLACE_DETAIL_PANEL && Boolean(selectedPlaceId);
  const isExistingPlaceReviewPanel =
    panelName === EXISTING_PLACE_REVIEW_PANEL && Boolean(selectedPlaceId);
  const { places, pagination } = await getPlacesAction({
    page: requestedPage,
    pageSize: PLACES_PAGE_SIZE,
  });
  const closePanelHref = buildPlacesHref({ page: pagination.page });
  const newPlaceReviewHref = buildPlacesHref({
    page: pagination.page,
    panel: NEW_PLACE_REVIEW_PANEL,
  });
  const buildPlaceDetailHref = (placeId: string) =>
    buildPlacesHref({
      page: pagination.page,
      panel: PLACE_DETAIL_PANEL,
      placeId,
    });
  const buildExistingPlaceReviewHref = (placeId: string) =>
    buildPlacesHref({
      page: pagination.page,
      panel: EXISTING_PLACE_REVIEW_PANEL,
      placeId,
    });
  const placeDetailHrefs = Object.fromEntries(
    places.map((place) => [place.id, buildPlaceDetailHref(place.id)])
  );
  const placeMarkers = toPlaceMarkers(places).map((marker) => ({
    ...marker,
    href: placeDetailHrefs[marker.id],
  }));
  const selectedMarkerId =
    isPlaceDetailPanel || isExistingPlaceReviewPanel ? selectedPlaceId : null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden not-italic">
      <MapMarkersSync source="places" markers={placeMarkers} selectedMarkerId={selectedMarkerId} />
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-950">お店を検索</h2>
        <Button asChild size="sm" className="gap-2">
          <Link href={newPlaceReviewHref} scroll={false}>
            <Plus className="size-4" aria-hidden="true" />
            新しいレビュー
          </Link>
        </Button>
      </div>
      {/* <SearchFilterBar /> */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <p className="mt-1 text-sm text-slate-500">お店一覧 ({pagination.totalCount}件)</p>
        <PlacesList places={places} placeDetailHrefs={placeDetailHrefs} />
      </div>
      <PlacesPagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        hasPreviousPage={pagination.hasPreviousPage}
        hasNextPage={pagination.hasNextPage}
      />
      {isNewPlaceReviewPanel ? (
        <NewPlaceReviewPanel closeHref={closePanelHref} page={pagination.page} />
      ) : null}
      {isPlaceDetailPanel && selectedPlaceId ? (
        <PlaceDetailPanel
          closeHref={closePanelHref}
          placeId={selectedPlaceId}
          detailHref={buildPlaceDetailHref(selectedPlaceId)}
          reviewHref={buildExistingPlaceReviewHref(selectedPlaceId)}
        />
      ) : null}
      {isExistingPlaceReviewPanel && selectedPlaceId ? (
        <ExistingPlaceReviewPanel
          closeHref={closePanelHref}
          detailHref={buildPlaceDetailHref(selectedPlaceId)}
          placeId={selectedPlaceId}
        />
      ) : null}
    </div>
  );
}
