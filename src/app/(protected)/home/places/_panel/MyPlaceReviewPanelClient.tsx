"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ReviewDetail } from "@/features/review/components/ReviewDetail";

type MyReviewPanelClientProps = {
  review: {
    id: string;
    authorName: string;
    rating: number;
    priceRange: number | null;
    date: Date;
    visitDate: string | null;
    comment: string;
    tags: string[];
    initialLikeCount: number;
    initialIsLiked: boolean;
    authorId: string;
  };
  currentUserId: string;
  editHref: string;
  closeHref: string;
  onLikeToggle: (reviewId: string, shouldLike: boolean) => Promise<void>;
};

export function MyPlaceReviewPanelClient({
  review,
  currentUserId,
  editHref,
  closeHref,
  onLikeToggle,
}: MyReviewPanelClientProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none flex-col gap-3 border-b border-slate-100 px-4 py-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-fit justify-start gap-2 px-0 text-xs"
        >
          <Link href={closeHref} scroll={false}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            戻る
          </Link>
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ReviewDetail
          id={review.id}
          mode="shop-detail"
          name={review.authorName}
          rating={review.rating}
          priceRange={review.priceRange}
          date={review.date}
          visitDate={review.visitDate}
          comment={review.comment}
          tags={review.tags}
          initialLikeCount={review.initialLikeCount}
          initialIsLiked={review.initialIsLiked}
          currentUserId={currentUserId}
          authorId={review.authorId}
          editHref={editHref.replace("__REVIEW_ID__", review.id)}
          onLikeToggle={onLikeToggle}
        />
      </div>
    </div>
  );
}
