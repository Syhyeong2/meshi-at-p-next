import {
  buildPanelHref,
  EXISTING_PLACE_REVIEW_PANEL,
  NEW_PLACE_REVIEW_PANEL,
  PLACE_DETAIL_PANEL,
  PLACE_REVIEWS_PANEL,
  EDIT_PLACE_REVIEW_PANEL,
  MY_REVIEWS_PANEL,
} from "./panelLinks";
import { ExistingPlaceReviewPanel } from "./ExistingPlaceReviewPanel";
import { PlaceDetailPanel } from "./PlaceDetailPanel";
import { PlaceReviewsPanel } from "./PlaceReviewsPanel";
import { EditPlaceReviewPanel } from "./EditPlaceReviewPanel";
import { NewPlaceReviewPanel } from "./NewPlaceReviewPanel";
import { MyPlaceReviewPanel } from "./MyPlaceReviewPanel";

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
  // 共通の閉じる用リンク
  const closePanelHref = buildPanelHref(baseParams, {
    basePath,
    page,
  });

  if (panel === NEW_PLACE_REVIEW_PANEL) {
    return <NewPlaceReviewPanel closeHref={closePanelHref} page={page as number} />;
  }
  const isMyPlaceReviewPanel = panel === MY_REVIEWS_PANEL;

  if (isMyPlaceReviewPanel && reviewId) {
    return (
      <MyPlaceReviewPanel
        closeHref={closePanelHref}
        reviewId={reviewId}
        baseParams={baseParams}
        basePath={basePath}
      />
    );
  }

  const isEditPlaceReviewPanel = panel === EDIT_PLACE_REVIEW_PANEL && Boolean(reviewId);

  if (isEditPlaceReviewPanel && reviewId) {
    const isMypage = basePath.startsWith("/home/mypage");
    return (
      <EditPlaceReviewPanel
        closeHref={buildPanelHref(baseParams, {
          basePath,
          page,
          panel: isMypage ? MY_REVIEWS_PANEL : PLACE_REVIEWS_PANEL,
          placeId,
          reviewId,
        })}
        placeId={placeId}
        reviewId={reviewId}
      />
    );
  }

  // placeIdが必須のパネル
  if (!placeId) return null;

  const isPlaceDetailPanel = panel === PLACE_DETAIL_PANEL;
  const isExistingPlaceReviewPanel = panel === EXISTING_PLACE_REVIEW_PANEL;
  const isPlaceReviewsPanel = panel === PLACE_REVIEWS_PANEL;

  const buildDetailHref = (pid: string) =>
    buildPanelHref(baseParams, {
      basePath,
      page,
      panel: PLACE_DETAIL_PANEL,
      placeId: pid,
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
        basePath={basePath}
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

  return null;
}
