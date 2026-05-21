import { MapMarkersSync } from "@/components/google-maps";
import { getPlacesAction } from "@/features/places/actions";
import type { PlaceSort } from "@/features/places/actions";
import { toPlaceMarkers } from "@/features/places/placeMarkers";
import { NewPlaceReviewPanel } from "./_panel/NewPlaceReviewPanel";
import { PlacesPanelManager } from "./_panel/PlacesPanelManager";
import {
  buildPlacesHref,
  EXISTING_PLACE_REVIEW_PANEL,
  NEW_PLACE_REVIEW_PANEL,
  PLACE_DETAIL_PANEL,
  PLACE_REVIEWS_PANEL,
} from "./_panel/panelLinks";
import { ExploreLeftPanel } from "@/features/places/components/ExploreLeftPanel";
import { Footer } from "@/components/ui/Footer";

const PLACES_PAGE_SIZE = 20;

type SearchParamValue = string | string[] | undefined;

type ExplorePageProps = {
  searchParams: Promise<{
    page?: SearchParamValue;
    panel?: SearchParamValue;
    placeId?: SearchParamValue;
    reviewId?: SearchParamValue;
    rating?: SearchParamValue;
    price?: SearchParamValue;
    category?: SearchParamValue;
    tags?: SearchParamValue;
    gotimeshi?: SearchParamValue;
    keyword?: SearchParamValue;
    sort?: SearchParamValue;
  }>;
};

const GOOGLE_PLACE_CATEGORIES = {
  CAFE: "カフェ",
  SUSHI: "寿司",
  RAMEN: "ラーメン",
  CHINESE: "中華",
  CURRY: "カレー",
  IZAKAYA: "居酒屋",
  SWEETS: "スイーツ",
  BAR: "バー",
  JAPANESE: "和食",
  YAKINIKU: "焼肉",
  WESTERN: "洋食",
  FAST_FOOD: "ファストフード",
  ASIAN: "アジア",
  OTHERS: "その他",
};

function getFirstParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePageParam(value: SearchParamValue): number {
  const parsedPage = Number(getFirstParam(value));

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}

function parsePlaceSortParam(value: SearchParamValue): PlaceSort {
  const sort = getFirstParam(value);

  return sort === "review_count" || sort === "distance" ? sort : "rating";
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const {
    page,
    panel,
    placeId,
    reviewId,
    keyword,
    rating,
    price,
    category,
    tags,
    gotimeshi,
    sort,
  } = await searchParams;
  const searchParamsObj = await searchParams;
  const baseParams = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParamsObj)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => baseParams.append(key, v));
    } else {
      baseParams.set(key, value);
    }
  }
  const placeSort = parsePlaceSortParam(sort);
  if (placeSort === "rating") {
    baseParams.delete("sort");
  } else {
    baseParams.set("sort", placeSort);
  }
  const requestedPage = parsePageParam(page);
  const panelName = getFirstParam(panel);
  const selectedPlaceId = getFirstParam(placeId);
  const selectedReviewId = getFirstParam(reviewId);
  const selectedkeyward = keyword ? String(getFirstParam(keyword)) : undefined;
  const filterRating = rating ? Number(getFirstParam(rating)) : 0;
  const filterPrice = price ? Number(getFirstParam(price)) : null;
  const categories = Array.isArray(category) ? category : category ? [category] : [];
  const filterCategories = categories.map(
    (key) => GOOGLE_PLACE_CATEGORIES[key as keyof typeof GOOGLE_PLACE_CATEGORIES] || key
  );
  const filterTags = Array.isArray(tags) ? tags : tags ? [tags] : [];
  const isGochimeshiSelected = getFirstParam(gotimeshi) === "true";
  const isNewPlaceReviewPanel = panelName === NEW_PLACE_REVIEW_PANEL;
  const isPlaceDetailPanel = panelName === PLACE_DETAIL_PANEL && Boolean(selectedPlaceId);
  const isExistingPlaceReviewPanel =
    panelName === EXISTING_PLACE_REVIEW_PANEL && Boolean(selectedPlaceId);
  const isPlaceReviewsPanel = panelName === PLACE_REVIEWS_PANEL && Boolean(selectedPlaceId);
  const { places, pagination } = await getPlacesAction({
    page: requestedPage,
    pageSize: PLACES_PAGE_SIZE,
    keyword: selectedkeyward,
    rating: filterRating,
    price: filterPrice,
    categories: filterCategories,
    tags: filterTags,
    isGochimeshi: isGochimeshiSelected,
    sort: placeSort,
  });
  const closePanelHref = buildPlacesHref(baseParams, { page: pagination.page });
  const newPlaceReviewHref = buildPlacesHref(baseParams, {
    page: pagination.page,
    panel: NEW_PLACE_REVIEW_PANEL,
  });
  const buildPlaceDetailHref = (placeId: string) =>
    buildPlacesHref(baseParams, {
      page: pagination.page,
      panel: PLACE_DETAIL_PANEL,
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
    isPlaceDetailPanel || isExistingPlaceReviewPanel || isPlaceReviewsPanel
      ? selectedPlaceId
      : null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <MapMarkersSync source="places" markers={placeMarkers} selectedMarkerId={selectedMarkerId} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ExploreLeftPanel
          places={places}
          pagination={pagination}
          newPlaceReviewHref={newPlaceReviewHref}
          placeDetailHrefs={placeDetailHrefs} // 一覧のリンク用
        />
        <Footer href={newPlaceReviewHref} submitText="新しいお店のレビューを書く" />
      </div>
      {isNewPlaceReviewPanel ? (
        <NewPlaceReviewPanel closeHref={closePanelHref} page={pagination.page} />
      ) : null}
      <PlacesPanelManager
        basePath="/home/places"
        panel={panelName}
        placeId={selectedPlaceId}
        reviewId={selectedReviewId}
        page={pagination.page}
        baseParams={baseParams}
      />
    </div>
  );
}
