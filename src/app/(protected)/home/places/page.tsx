import Link from "next/link";
import { Plus } from "lucide-react";

import { MapMarkersSync } from "@/components/google-maps";
import { Button } from "@/components/ui/Button";
import { getPlacesAction } from "@/features/places/actions";
import { NewPlaceReviewPanel } from "@/features/places/components/NewPlaceReviewPanel";
import { PlacesList } from "@/features/places/components/PlacesList";
import { PlacesPagination } from "@/features/places/components/PlacesPagination";
import { toPlaceMarkers } from "@/features/places/placeMarkers";
import { getTagGroupsAction } from "@/features/tag/actions";

const PLACES_PAGE_SIZE = 20;
const NEW_PLACE_REVIEW_PANEL = "new-place-review";

type SearchParamValue = string | string[] | undefined;

type ExplorePageProps = {
  searchParams: Promise<{
    page?: SearchParamValue;
    panel?: SearchParamValue;
  }>;
};

function getFirstParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePageParam(value: SearchParamValue): number {
  const parsedPage = Number(getFirstParam(value));

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}

function getPlacesHref(page: number, panel?: typeof NEW_PLACE_REVIEW_PANEL): string {
  const params = new URLSearchParams({ page: String(page) });

  if (panel) {
    params.set("panel", panel);
  }

  return `/home/places?${params.toString()}`;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { page, panel } = await searchParams;
  const requestedPage = parsePageParam(page);
  const isNewPlaceReviewPanel = getFirstParam(panel) === NEW_PLACE_REVIEW_PANEL;
  const placesResultPromise = getPlacesAction({
    page: requestedPage,
    pageSize: PLACES_PAGE_SIZE,
  });
  const tagGroupsPromise = isNewPlaceReviewPanel ? getTagGroupsAction() : Promise.resolve(null);
  const [{ places, pagination }, tagGroups] = await Promise.all([
    placesResultPromise,
    tagGroupsPromise,
  ]);
  const markers = toPlaceMarkers(places);
  const closePanelHref = getPlacesHref(pagination.page);
  const newPlaceReviewHref = getPlacesHref(pagination.page, NEW_PLACE_REVIEW_PANEL);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden not-italic">
      <MapMarkersSync source="places" markers={markers} />
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
        <PlacesList places={places} />
      </div>
      <PlacesPagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        hasPreviousPage={pagination.hasPreviousPage}
        hasNextPage={pagination.hasNextPage}
      />
      {isNewPlaceReviewPanel && tagGroups ? (
        <NewPlaceReviewPanel tagGroups={tagGroups} closeHref={closePanelHref} />
      ) : null}
    </div>
  );
}
