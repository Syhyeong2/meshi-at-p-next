"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewDetail } from "@/features/review/components/ReviewDetail";
import { AlertModal } from "@/components/ui/AlertModal";
import { deleteReviewAction } from "@/features/review/actions";
import { createPortal } from "react-dom";

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
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleExecuteDelete = async () => {
    const result = await deleteReviewAction(review.id);
    if (!result.success) {
      throw new Error(result.error);
    }
    setIsDeleteModalOpen(false);
    router.back();
    router.refresh();
  };

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
          onDelete={() => setIsDeleteModalOpen(true)}
        />
      </div>

      {createPortal(
        <AlertModal
          isOpen={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onConfirm={handleExecuteDelete}
          description="このレビューを削除しますか？"
          confirmText="削除する"
          pendingText="削除中..."
          errorMessage="レビューの削除に失敗しました。もう一度お試しください。"
        />,
        document.body
      )}
    </div>
  );
}
