import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUserReviewsAction } from "@/features/review/actions";
import { MyReviewCard } from "@/features/review/components/MyReviewCard";
import { buildPanelHref, MY_REVIEWS_PANEL } from "../../places/_panel/panelLinks";
import { PlacesPanelManager } from "../../places/_panel/PlacesPanelManager";
import { Button } from "@/components/ui/Button";

type MyReviewsPageProps = {
  searchParams: Promise<{
    panel?: string;
    placeId?: string;
    reviewId?: string;
  }>;
};

export default async function MyReviewsPage({ searchParams }: MyReviewsPageProps) {
  const { panel, placeId, reviewId } = await searchParams;
  const myReviews = await getUserReviewsAction();

  const buildReviewDetailHref = (rid: string) =>
    buildPanelHref("", {
      basePath: "/home/mypage/reviews",
      panel: MY_REVIEWS_PANEL,
      reviewId: rid,
    });

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center border-b border-b-slate-200 p-6">
          <div className="flex flex-1 flex-col gap-1 bg-white">
            <h1 className="text-xl font-bold text-slate-900">全てのレビュー</h1>
            <span className="text-slate-500">{myReviews.length}件のレビュー</span>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-fit justify-start gap-2 p-0 text-xs"
          >
            <Link href="/home/mypage">
              <ArrowLeft className="size-4" />
              マイページに戻る
            </Link>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {myReviews.length > 0 ? (
            <div className="flex flex-col gap-3">
              {myReviews.map((review) => (
                <MyReviewCard
                  key={review.id}
                  id={review.id}
                  place={review.place}
                  rating={review.rating}
                  comment={review.comment || ""}
                  date={new Date(review.date)}
                  tags={review.tags}
                  href={buildReviewDetailHref(review.id)}
                  isSelected={reviewId === review.id}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center py-20 text-sm text-slate-500">
              まだレビューがありません
            </div>
          )}
        </div>
      </div>

      <PlacesPanelManager
        basePath="/home/mypage/reviews"
        panel={panel}
        placeId={placeId}
        reviewId={reviewId}
      />
    </>
  );
}
