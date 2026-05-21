"use client";

import { ReviewDetail } from "@/features/review/components/ReviewDetail";

type MyReviewPanelClientProps = {
  review: {
    id: string;
    authorName: string;
    rating: number;
    place: string;
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
  onLikeToggle: (reviewId: string, shouldLike: boolean) => Promise<void>;
};

export function MyPlaceReviewPanelClient({
  review,
  currentUserId,
  editHref,
  onLikeToggle,
}: MyReviewPanelClientProps) {
  console.log(review);
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ReviewDetail
          id={review.id}
          mode="my-review"
          place={review.place}
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
