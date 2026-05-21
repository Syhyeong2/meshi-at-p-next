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

  // パネルの設定
  if (panel) {
    params.set("panel", panel);
  } else {
    params.delete("panel");
  }

  // placeIdが必要なパネル
  const needsPlaceId = [
    PLACE_DETAIL_PANEL,
    EXISTING_PLACE_REVIEW_PANEL,
    PLACE_REVIEWS_PANEL,
    EDIT_PLACE_REVIEW_PANEL,
  ].includes(panel as PlacesPanel);

  if (needsPlaceId && placeId) {
    params.set("placeId", placeId);
  } else {
    params.delete("placeId");
  }

  // reviewIdが必要なパネル
  const needsReviewId = [PLACE_REVIEWS_PANEL, MY_REVIEWS_PANEL].includes(panel as PlacesPanel);

  if (needsReviewId && reviewId) {
    params.set("reviewId", reviewId);
  } else {
    params.delete("reviewId");
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}
