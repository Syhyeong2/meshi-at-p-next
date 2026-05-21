import Link from "next/link";
import { NicknameEditForm } from "@/features/profile/components/NicknameEditForm";
import { PlaceList } from "@/features/places/components/PlaceList";
import {
  buildPanelHref,
  PLACE_DETAIL_PANEL,
  MY_REVIEWS_PANEL,
  NEW_PLACE_REVIEW_PANEL,
} from "../places/_panel/panelLinks";
import { MapMarkersSync } from "@/components/google-maps";
import { toPlaceMarkers } from "@/features/places/placeMarkers";
import { PlacesPanelManager } from "../places/_panel/PlacesPanelManager";
import { MyReviewCard } from "@/features/review/components/MyReviewCard";
import { Footer } from "@/components/ui/Footer";
import { getUserProfileStatsAction } from "@/features/profile/actions";

type MypageProps = {
  searchParams: Promise<{
    panel?: string;
    placeId?: string;
    reviewId?: string;
  }>;
};

export default async function Mypage({ searchParams }: MypageProps) {
  const { panel, placeId, reviewId } = await searchParams;
  const { user, stats, bookmarkedPlaces, myReviews } = await getUserProfileStatsAction();

  const buildDetailHref = (pid: string) =>
    buildPanelHref("", {
      basePath: "/home/mypage",
      panel: PLACE_DETAIL_PANEL,
      placeId: pid,
    });

  const buildReviewDetailHref = (pid: string, rid: string) =>
    buildPanelHref("", {
      basePath: "/home/mypage",
      panel: MY_REVIEWS_PANEL,
      placeId: pid,
      reviewId: rid,
    });

  const placeDetailHrefs = Object.fromEntries(
    bookmarkedPlaces.map((place) => [place.id, buildDetailHref(place.id)])
  );

  const placeMarkers = toPlaceMarkers(bookmarkedPlaces).map((marker) => ({
    ...marker,
    href: placeDetailHrefs[marker.id],
  }));

  const newPlaceReviewHref = buildPanelHref("", {
    basePath: "/home/mypage",
    panel: NEW_PLACE_REVIEW_PANEL,
  });

  return (
    <>
      <MapMarkersSync source="mypage" markers={placeMarkers} selectedMarkerId={placeId} />
      <div className="flex h-full flex-col overflow-y-auto pb-20">
        <div className="flex flex-col gap-4 border-b border-b-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold text-slate-900">マイページ</h1>
          <div className="bg-primary-background flex w-full flex-col gap-4 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <NicknameEditForm initialNickname={user.nickname} />
              </div>
            </div>
            <div className="flex w-full gap-6">
              <Link
                href="/home/mypage/reviews"
                className="flex-1 rounded-lg bg-white p-2 text-center transition-colors hover:bg-slate-50"
              >
                <p className="text-primary text-xl font-bold">{stats.reviews}</p>
                <p className="text-xs text-slate-500">レビュー</p>
              </Link>
              <Link
                href="/home/bookmarks"
                className="flex-1 rounded-lg bg-white p-2 pb-0 text-center transition-colors hover:bg-slate-50"
              >
                <p className="text-primary text-xl font-bold">{stats.bookmarks}</p>
                <p className="text-xs text-slate-500">ブックマーク</p>
              </Link>
            </div>
          </div>
        </div>

        {/* マイレビューセクション */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
          <div className="flex items-center">
            <h2 className="flex-1 text-sm font-bold">マイレビュー</h2>
            <Link
              href="/home/mypage/reviews"
              className="text-primary cursor-pointer text-sm hover:underline"
            >
              全てのレビュー
            </Link>
          </div>
          {myReviews.length > 0 ? (
            <div className="flex flex-col gap-2">
              {myReviews.map((review) => (
                <MyReviewCard
                  key={review.id}
                  id={review.id}
                  place={review.place}
                  rating={review.rating}
                  comment={review.comment || ""}
                  date={new Date(review.date)}
                  tags={review.tags}
                  href={buildReviewDetailHref(review.place, review.id)}
                  isSelected={reviewId === review.id}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 text-sm text-slate-500">
              まだレビューがありません
            </div>
          )}
        </div>

        {/* ブックマークセクション */}
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center">
            <h2 className="flex-1 text-sm font-bold">
              ブックマーク{" "}
              <span className="font-medium text-slate-500">({bookmarkedPlaces.length ?? 0})</span>
            </h2>
            <Link href="/home/bookmarks" className="text-primary text-sm hover:underline">
              全てのブックマーク
            </Link>
          </div>

          {bookmarkedPlaces.length > 0 ? (
            <PlaceList
              places={bookmarkedPlaces}
              placeDetailHrefs={placeDetailHrefs}
              activePlaceId={placeId}
            />
          ) : (
            <div className="flex items-center justify-center py-10 text-sm text-slate-500">
              まだブックマークした店がありません
            </div>
          )}
        </div>
      </div>

      <Footer href={newPlaceReviewHref} submitText="店のレビューを投稿する" />

      <PlacesPanelManager
        basePath="/home/mypage"
        panel={panel}
        placeId={placeId}
        reviewId={reviewId}
      />
    </>
  );
}
