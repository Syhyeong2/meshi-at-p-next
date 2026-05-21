"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { getPlaceReviewsAction } from "@/features/places/actions";
import type { PlaceReviewSort } from "@/features/places/actions";
import type { PlaceReview } from "@/features/places/types";
import { ReviewCard } from "@/features/review/components/ReviewCard";
import { ReviewDetail } from "@/features/review/components/ReviewDetail";
import { toggleReviewLikeAction } from "@/features/review/actions";
import { deleteReviewAction } from "@/features/review/actions";
import { AlertModal } from "@/components/ui/AlertModal";
import { createPortal } from "react-dom";

type PlaceReviewsPanelClientProps = {
  detailHref: string;
  hasMore: boolean;
  initialReviewId?: string;
  nextOffset: number;
  placeName: string;
  placeId: string;
  reviews: PlaceReview[];
  reviewsHref: string;
  totalReviewCount: number;
  currentUserId: string;
  editHrefTemplate: string;
};

const REVIEW_SORT_OPTIONS: { label: string; value: PlaceReviewSort }[] = [
  { label: "最新順", value: "latest" },
  { label: "評価順", value: "rating" },
];

export function PlaceReviewsPanelClient({
  detailHref,
  hasMore: initialHasMore,
  initialReviewId,
  nextOffset: initialNextOffset,
  placeName,
  placeId,
  reviews,
  reviewsHref,
  totalReviewCount,
  currentUserId,
  editHrefTemplate,
}: PlaceReviewsPanelClientProps) {
  const [sort, setSort] = useState<PlaceReviewSort>("latest");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [reviewItems, setReviewItems] = useState(reviews);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextOffset, setNextOffset] = useState(initialNextOffset);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(initialReviewId ?? null);
  const selectedReview = reviewItems.find((review) => review.id === selectedReviewId) ?? null;
  const isReviewDetail = Boolean(selectedReview);
  const currentSortLabel =
    REVIEW_SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "最新順";
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const toggleLike = async (reviewId: string, newState: boolean) => {
    await toggleReviewLikeAction(reviewId, newState);
    setReviewItems((currentReviews) =>
      currentReviews.map((review) => {
        if (review.id !== reviewId) {
          return review;
        }

        return {
          ...review,
          initialIsLiked: newState,
          initialLikeCount: Math.max(0, review.initialLikeCount + (newState ? 1 : -1)),
        };
      })
    );
  };

  const showReviewList = () => {
    setSelectedReviewId(null);
    window.history.replaceState(null, "", reviewsHref);
  };

  const loadMoreReviews = async () => {
    if (isLoadingMore || isSorting || !hasMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const reviewsPage = await getPlaceReviewsAction(placeId, {
        offset: nextOffset,
        sort,
      });

      setReviewItems((currentReviews) => {
        const currentReviewIds = new Set(currentReviews.map((review) => review.id));
        const newReviews = reviewsPage.reviews.filter((review) => !currentReviewIds.has(review.id));

        return [...currentReviews, ...newReviews];
      });
      setHasMore(reviewsPage.hasMore);
      setNextOffset(reviewsPage.nextOffset);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const changeSort = async (nextSort: PlaceReviewSort) => {
    if (sort === nextSort || isSorting || isLoadingMore) {
      return;
    }

    setSortMenuOpen(false);
    setIsSorting(true);

    try {
      const reviewsPage = await getPlaceReviewsAction(placeId, {
        offset: 0,
        sort: nextSort,
      });

      setSort(nextSort);
      setSelectedReviewId(null);
      setReviewItems(reviewsPage.reviews);
      setHasMore(reviewsPage.hasMore);
      setNextOffset(reviewsPage.nextOffset);
    } finally {
      setIsSorting(false);
    }
  };

  const handleTrashClick = () => {
    setIsDeleteModalOpen(true);
  };
  const handleExecuteDelete = async () => {
    if (!selectedReviewId) return;
    const result = await deleteReviewAction(selectedReviewId);
    if (!result.success) {
      throw new Error(result.error);
    }
    setReviewItems((currentItems) => currentItems.filter((item) => item.id !== selectedReviewId));
    setSelectedReviewId(null);
  };

  return (
    <div className="relative z-40 flex h-full flex-col">
      <div className="flex flex-none flex-col gap-3 border-b border-slate-100 p-4">
        {isReviewDetail ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-0 w-fit justify-start gap-2 self-start px-0 text-xs"
            onClick={showReviewList}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            全てのレビュー
          </Button>
        ) : (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-0 w-fit justify-start gap-2 self-start px-0 text-xs"
          >
            <Link href={detailHref} scroll={false}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              お店に戻る
            </Link>
          </Button>
        )}
        <div className="-mt-1 -mb-2 flex min-h-8 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <h4 className="mt-0 text-lg font-bold break-words text-slate-950">{placeName}</h4>
            {!isReviewDetail ? (
              <p className="mt-0 shrink-0 text-xs font-medium text-slate-500">
                {totalReviewCount}件
              </p>
            ) : null}
          </div>
          {!isReviewDetail ? (
            <Popover open={sortMenuOpen} onOpenChange={setSortMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                  disabled={isSorting || isLoadingMore}
                >
                  {currentSortLabel}
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="z-30 w-32 gap-1 border border-slate-200 bg-white p-1 shadow-xl"
              >
                {REVIEW_SORT_OPTIONS.map((option) => {
                  const isSelected = sort === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`flex h-9 w-full items-center justify-between rounded-md px-2.5 text-left text-xs font-bold transition-colors ${
                        isSelected
                          ? "bg-slate-100 text-slate-950"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                      }`}
                      disabled={isSorting || isLoadingMore}
                      onClick={() => changeSort(option.value)}
                    >
                      {option.label}
                      {isSelected ? <Check className="size-3.5" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>
          ) : (
            <div className="h-8 w-[72px] shrink-0" aria-hidden="true" />
          )}
        </div>
      </div>

      {selectedReview ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ReviewDetail
            id={selectedReview.id}
            mode="shop-detail"
            name={selectedReview.authorName}
            rating={selectedReview.rating}
            priceRange={selectedReview.priceRange}
            date={selectedReview.date}
            visitDate={selectedReview.visitDate}
            comment={selectedReview.comment}
            tags={selectedReview.tags}
            initialLikeCount={selectedReview.initialLikeCount}
            initialIsLiked={selectedReview.initialIsLiked}
            currentUserId={currentUserId}
            authorId={selectedReview.authorId}
            editHref={editHrefTemplate.replace("__REVIEW_ID__", selectedReview.id)}
            onLikeToggle={toggleLike}
            onDelete={handleTrashClick}
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {reviewItems.length > 0 ? (
            <div className="space-y-3">
              {reviewItems.map((review) => (
                <ReviewCard
                  key={review.id}
                  id={review.id}
                  name={review.authorName}
                  rating={review.rating}
                  comment={review.comment}
                  date={review.date}
                  variant="reviewList"
                  onClick={setSelectedReviewId}
                />
              ))}
              {hasMore ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-full"
                  disabled={isLoadingMore || isSorting}
                  onClick={loadMoreReviews}
                >
                  {isLoadingMore || isSorting ? "読み込み中..." : "もっと見る"}
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
              まだ社員レビューがありません。
            </div>
          )}
        </div>
      )}
      {typeof window !== "undefined" && isDeleteModalOpen
        ? createPortal(
            <AlertModal
              isOpen={isDeleteModalOpen}
              onOpenChange={setIsDeleteModalOpen}
              onConfirm={handleExecuteDelete}
              description="このレビューを削除しますか？"
              confirmText="削除する"
              pendingText="削除中..."
              errorMessage="レビューの削除に失敗しました。もう一度お試しください。"
            />,
            document.getElementById("places_layout")!
          )
        : null}
    </div>
  );
}
