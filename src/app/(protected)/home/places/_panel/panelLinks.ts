import {
  buildClosePlacesPanelHref,
  buildPlacesPanelHref,
  EDIT_PLACE_REVIEW_PANEL,
  EXISTING_PLACE_REVIEW_PANEL,
  MY_REVIEWS_PANEL,
  NEW_PLACE_REVIEW_PANEL,
  PLACE_DETAIL_PANEL,
  PLACE_REVIEWS_PANEL,
  type BuildPlacesPanelHrefOptions,
  type PlacesPanel,
  type PlacesSearchParamsInput,
} from "@/features/places/placeQuery";

export {
  EDIT_PLACE_REVIEW_PANEL,
  EXISTING_PLACE_REVIEW_PANEL,
  MY_REVIEWS_PANEL,
  NEW_PLACE_REVIEW_PANEL,
  PLACE_DETAIL_PANEL,
  PLACE_REVIEWS_PANEL,
  type PlacesPanel,
};

type BuildPanelHrefOptions = BuildPlacesPanelHrefOptions;

export function buildPanelHref(
  baseParams: PlacesSearchParamsInput,
  options: BuildPanelHrefOptions
): string {
  return options.panel
    ? buildPlacesPanelHref(baseParams, options)
    : buildClosePlacesPanelHref(baseParams, options);
}

export const buildPlacesHref = buildPanelHref;
