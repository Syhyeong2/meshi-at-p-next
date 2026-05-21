import { HomePanelFrame } from "../../_panel/HomePanelFrame";
import { requireActiveUser } from "@/features/auth/access";
import { MyPlaceReviewPanelClient } from "./MyPlaceReviewPanelClient";
import { buildPanelHref, EDIT_PLACE_REVIEW_PANEL } from "./panelLinks";
import { getReviewAction, toggleReviewLikeAction } from "@/features/review/actions";
import { MY_REVIEWS_PANEL } from "./panelLinks";

type MyPlaceReviewPanelProps = {
  closeHref: string;
  placeId?: string;
  reviewId: string;
  baseParams?: string | URLSearchParams;
  basePath?: string;
};

export async function MyPlaceReviewPanel({
  closeHref,
  placeId,
  reviewId,
  baseParams = "",
  basePath = "/home/mypage/reviews",
}: MyPlaceReviewPanelProps) {
  const [user, review] = await Promise.all([requireActiveUser(), getReviewAction(reviewId)]);

  if (!review) {
    return (
      <HomePanelFrame title="レビュー詳細" closeHref={closeHref}>
        <div className="flex-1 p-6 text-center font-bold text-red-500">
          レビューが見つかりませんでした。
        </div>
      </HomePanelFrame>
    );
  }

  const isMypage = basePath.startsWith("/home/mypage");

  const editHref = buildPanelHref(baseParams, {
    basePath,
    panel: EDIT_PLACE_REVIEW_PANEL,
    placeId: isMypage ? undefined : (placeId ?? review.placeId),
    reviewId: reviewId,
  });

  const handleLikeToggle = async (rid: string, shouldLike: boolean) => {
    "use server";
    await toggleReviewLikeAction(rid, shouldLike);
  };

  return (
    <HomePanelFrame title="レビュー詳細" closeHref={closeHref}>
      <MyPlaceReviewPanelClient
        review={{
          ...review,
          date: new Date(review.date),
        }}
        currentUserId={user.userId}
        editHref={editHref}
        onLikeToggle={handleLikeToggle}
      />
    </HomePanelFrame>
  );
}
