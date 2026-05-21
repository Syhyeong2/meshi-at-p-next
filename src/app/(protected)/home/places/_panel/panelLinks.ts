export const NEW_PLACE_REVIEW_PANEL = "new-place-review";
export const PLACE_DETAIL_PANEL = "place-detail";
export const EXISTING_PLACE_REVIEW_PANEL = "existing-place-review";
export const PLACE_REVIEWS_PANEL = "place-reviews";
export const EDIT_PLACE_REVIEW_PANEL = "edit-place-review";

export type PlacesPanel =
  | typeof NEW_PLACE_REVIEW_PANEL
  | typeof PLACE_DETAIL_PANEL
  | typeof EXISTING_PLACE_REVIEW_PANEL
  | typeof PLACE_REVIEWS_PANEL
  | typeof EDIT_PLACE_REVIEW_PANEL;

type BuildPanelHrefOptions = {
  basePath?: string;
  page?: number;
  panel?: PlacesPanel;
  placeId?: string;
  reviewId?: string;
};

export function buildPanelHref(
  baseParams: string | URLSearchParams,
  { basePath = "/home/places", page, panel, placeId, reviewId }: BuildPanelHrefOptions
): string {
  const params = new URLSearchParams(baseParams);

  if (page !== undefined) {
    params.set("page", String(page));
  }

  if (panel) {
    params.set("panel", panel);
  } else {
    params.delete("panel");
  }

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

  if ((panel === PLACE_REVIEWS_PANEL || panel === EDIT_PLACE_REVIEW_PANEL) && reviewId) {
    params.set("reviewId", reviewId);
  } else {
    params.delete("reviewId");
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

// 既存のコードとの互換性のためのエイリアス
export const buildPlacesHref = (
  baseParams: string | URLSearchParams,
  options: { page: number; panel?: PlacesPanel; placeId?: string; reviewId?: string }
) => buildPanelHref(baseParams, options);
