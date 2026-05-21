import {
  buildPanelHref,
  EXISTING_PLACE_REVIEW_PANEL,
  PLACE_DETAIL_PANEL,
  PLACE_REVIEWS_PANEL,
  EDIT_PLACE_REVIEW_PANEL,
} from "./panelLinks";
import { ExistingPlaceReviewPanel } from "./ExistingPlaceReviewPanel";
import { PlaceDetailPanel } from "./PlaceDetailPanel";
import { PlaceReviewsPanel } from "./PlaceReviewsPanel";
import { EditPlaceReviewPanel } from "./EditPlaceReviewPanel";

type PlacesPanelManagerProps = {
  basePath: string;
  panel?: string;
  placeId?: string;
  reviewId?: string;
  page?: number;
  baseParams?: string | URLSearchParams;
};

export function PlacesPanelManager({
  basePath,
  panel,
  placeId,
  reviewId,
  page,
  baseParams = "",
}: PlacesPanelManagerProps) {
  const isPlaceDetailPanel = panel === PLACE_DETAIL_PANEL && Boolean(placeId);
  const isExistingPlaceReviewPanel = panel === EXISTING_PLACE_REVIEW_PANEL && Boolean(placeId);
  const isPlaceReviewsPanel = panel === PLACE_REVIEWS_PANEL && Boolean(placeId);
  const isEditPlaceReviewPanel =
    panel === EDIT_PLACE_REVIEW_PANEL && Boolean(placeId) && Boolean(reviewId);

  if (!placeId) return null;

  const buildDetailHref = (pid: string) =>
    buildPanelHref(baseParams, {
      basePath,
      page,
      panel: PLACE_DETAIL_PANEL,
      placeId: pid,
    });

  const closePanelHref = buildPanelHref(baseParams, {
    basePath,
    page,
  });

  if (isPlaceDetailPanel) {
    return (
      <PlaceDetailPanel
        closeHref={closePanelHref}
        placeId={placeId}
        detailHref={buildDetailHref(placeId)}
        reviewHref={buildPanelHref(baseParams, {
          basePath,
          page,
          panel: EXISTING_PLACE_REVIEW_PANEL,
          placeId,
        })}
        reviewDetailHref={(rid) =>
          buildPanelHref(baseParams, {
            basePath,
            page,
            panel: PLACE_REVIEWS_PANEL,
            placeId,
            reviewId: rid,
          })
        }
        reviewsHref={buildPanelHref(baseParams, {
          basePath,
          page,
          panel: PLACE_REVIEWS_PANEL,
          placeId,
        })}
      />
    );
  }

  if (isExistingPlaceReviewPanel) {
    return (
      <ExistingPlaceReviewPanel
        closeHref={buildDetailHref(placeId)}
        detailHref={buildDetailHref(placeId)}
        placeId={placeId}
      />
    );
  }

  if (isPlaceReviewsPanel) {
    return (
      <PlaceReviewsPanel
        closeHref={buildDetailHref(placeId)}
        detailHref={buildDetailHref(placeId)}
        initialReviewId={reviewId}
        placeId={placeId}
        reviewsHref={buildPanelHref(baseParams, {
          basePath,
          page,
          panel: PLACE_REVIEWS_PANEL,
          placeId,
        })}
        editHrefTemplate={(rid: string) =>
          buildPanelHref(baseParams, {
            basePath,
            page,
            panel: EDIT_PLACE_REVIEW_PANEL,
            placeId,
            reviewId: rid,
          })
        }
      />
    );
  }
  if (isEditPlaceReviewPanel && reviewId) {
    return (
      <EditPlaceReviewPanel
        closeHref={buildPanelHref(baseParams, {
          basePath,
          page,
          panel: PLACE_REVIEWS_PANEL,
          placeId,
        })}
        placeId={placeId}
        reviewId={reviewId}
      />
    );
  }

  return null;
}
