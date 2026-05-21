export const NEW_PLACE_REVIEW_PANEL = "new-place-review";
export const PLACE_DETAIL_PANEL = "place-detail";
export const EXISTING_PLACE_REVIEW_PANEL = "existing-place-review";
export const PLACE_REVIEWS_PANEL = "place-reviews";
export const EDIT_PLACE_REVIEW_PANEL = "edit-place-review";
export const MY_REVIEWS_PANEL = "my-reviews";

export type PlacesPanel =
  | typeof NEW_PLACE_REVIEW_PANEL
  | typeof PLACE_DETAIL_PANEL
  | typeof EXISTING_PLACE_REVIEW_PANEL
  | typeof PLACE_REVIEWS_PANEL
  | typeof EDIT_PLACE_REVIEW_PANEL
  | typeof MY_REVIEWS_PANEL;

export type PlacesListSort = "rating" | "review_count" | "distance";

export type PlacesSearchParamsInput = string | URLSearchParams | { toString(): string };

export type BuildPlacesListHrefOptions = {
  basePath?: string;
  page?: number;
  keyword?: string | null;
  rating?: number | null;
  price?: number | null;
  categories?: string[] | null;
  tags?: string[] | null;
  gotimeshi?: boolean | null;
  sort?: PlacesListSort | null;
  preservePanel?: boolean;
};

export type BuildPlacesPanelHrefOptions = {
  basePath?: string;
  page?: number;
  panel?: PlacesPanel;
  placeId?: string;
  reviewId?: string;
};

const DEFAULT_PLACES_BASE_PATH = "/home/places";
const PANEL_PARAM_KEYS = ["panel", "placeId", "reviewId"] as const;

function getSearchString(params: PlacesSearchParamsInput): string {
  if (typeof params !== "string") {
    return params.toString();
  }

  const queryStartIndex = params.indexOf("?");
  const looksLikeHref = params.startsWith("/") || params.startsWith("http");
  let searchString = params;

  if (looksLikeHref) {
    searchString = queryStartIndex >= 0 ? params.slice(queryStartIndex + 1) : "";
  }

  const hashStartIndex = searchString.indexOf("#");

  return hashStartIndex >= 0 ? searchString.slice(0, hashStartIndex) : searchString;
}

function createSearchParams(params: PlacesSearchParamsInput): URLSearchParams {
  return new URLSearchParams(getSearchString(params));
}

function clearPanelParams(params: URLSearchParams) {
  PANEL_PARAM_KEYS.forEach((key) => params.delete(key));
}

function isPlacesPanel(panel: string | null): panel is PlacesPanel {
  return (
    panel === NEW_PLACE_REVIEW_PANEL ||
    panel === PLACE_DETAIL_PANEL ||
    panel === EXISTING_PLACE_REVIEW_PANEL ||
    panel === PLACE_REVIEWS_PANEL ||
    panel === EDIT_PLACE_REVIEW_PANEL ||
    panel === MY_REVIEWS_PANEL
  );
}

function normalizePanelParams(params: URLSearchParams) {
  const panel = params.get("panel");

  if (!isPlacesPanel(panel)) {
    clearPanelParams(params);
    return;
  }

  if (panel === NEW_PLACE_REVIEW_PANEL) {
    params.delete("placeId");
    params.delete("reviewId");
    return;
  }

  if (panel === MY_REVIEWS_PANEL) {
    if (!params.get("reviewId")) {
      clearPanelParams(params);
      return;
    }

    params.delete("placeId");
    return;
  }

  if (panel === EDIT_PLACE_REVIEW_PANEL) {
    if (!params.get("reviewId")) {
      clearPanelParams(params);
      return;
    }

    return;
  }

  if (!params.get("placeId")) {
    clearPanelParams(params);
    return;
  }

  if (panel !== PLACE_REVIEWS_PANEL) {
    params.delete("reviewId");
  }
}

function setNumberParam(params: URLSearchParams, key: string, value: number | null | undefined) {
  if (value === undefined) {
    return;
  }

  if (value === null || value <= 0) {
    params.delete(key);
    return;
  }

  params.set(key, String(value));
}

function setStringParam(params: URLSearchParams, key: string, value: string | null | undefined) {
  if (value === undefined) {
    return;
  }

  if (value === null) {
    params.delete(key);
    return;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    params.delete(key);
    return;
  }

  params.set(key, normalizedValue);
}

function setMultiValueParam(
  params: URLSearchParams,
  key: string,
  value: string[] | null | undefined
) {
  if (value === undefined) {
    return;
  }

  params.delete(key);

  if (!value) {
    return;
  }

  value.filter(Boolean).forEach((item) => params.append(key, item));
}

function setBooleanParam(params: URLSearchParams, key: string, value: boolean | null | undefined) {
  if (value === undefined) {
    return;
  }

  if (value) {
    params.set(key, "true");
  } else {
    params.delete(key);
  }
}

function setPlacesListSortParam(
  params: URLSearchParams,
  value: PlacesListSort | null | undefined
) {
  if (value === undefined) {
    return;
  }

  if (value === null || value === "rating") {
    params.delete("sort");
    return;
  }

  params.set("sort", value);
}

function toHref(basePath: string, params: URLSearchParams): string {
  const queryString = params.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function buildPlacesListHref(
  baseParams: PlacesSearchParamsInput,
  {
    basePath = DEFAULT_PLACES_BASE_PATH,
    page,
    keyword,
    rating,
    price,
    categories,
    tags,
    gotimeshi,
    sort,
    preservePanel = true,
  }: BuildPlacesListHrefOptions = {}
): string {
  const params = createSearchParams(baseParams);

  if (!preservePanel) {
    clearPanelParams(params);
  }

  setNumberParam(params, "page", page);
  setStringParam(params, "keyword", keyword);
  setNumberParam(params, "rating", rating);
  setNumberParam(params, "price", price);
  setMultiValueParam(params, "category", categories);
  setMultiValueParam(params, "tags", tags);
  setBooleanParam(params, "gotimeshi", gotimeshi);
  setPlacesListSortParam(params, sort);

  if (preservePanel) {
    normalizePanelParams(params);
  }

  return toHref(basePath, params);
}

export function buildClosePlacesPanelHref(
  baseParams: PlacesSearchParamsInput,
  {
    basePath = DEFAULT_PLACES_BASE_PATH,
    page,
  }: Pick<BuildPlacesPanelHrefOptions, "basePath" | "page"> = {}
): string {
  const params = createSearchParams(baseParams);

  if (page !== undefined) {
    params.set("page", String(page));
  }

  clearPanelParams(params);

  return toHref(basePath, params);
}

export function buildPlacesPanelHref(
  baseParams: PlacesSearchParamsInput,
  {
    basePath = DEFAULT_PLACES_BASE_PATH,
    page,
    panel,
    placeId,
    reviewId,
  }: BuildPlacesPanelHrefOptions = {}
): string {
  if (!panel) {
    return buildClosePlacesPanelHref(baseParams, { basePath, page });
  }

  const params = createSearchParams(baseParams);

  if (page !== undefined) {
    params.set("page", String(page));
  }

  params.set("panel", panel);

  if (
    (panel === PLACE_DETAIL_PANEL ||
      panel === EXISTING_PLACE_REVIEW_PANEL ||
      panel === PLACE_REVIEWS_PANEL ||
      panel === EDIT_PLACE_REVIEW_PANEL) &&
    placeId
  ) {
    params.set("placeId", placeId);
  } else {
    params.delete("placeId");
  }

  if (
    (panel === PLACE_REVIEWS_PANEL ||
      panel === EDIT_PLACE_REVIEW_PANEL ||
      panel === MY_REVIEWS_PANEL) &&
    reviewId
  ) {
    params.set("reviewId", reviewId);
  } else {
    params.delete("reviewId");
  }

  if (panel === MY_REVIEWS_PANEL) {
    params.delete("placeId");
  }

  normalizePanelParams(params);

  return toHref(basePath, params);
}
