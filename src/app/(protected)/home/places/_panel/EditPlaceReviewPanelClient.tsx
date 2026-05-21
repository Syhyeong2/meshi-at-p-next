"use client";

import { useRouter } from "next/navigation";
import { ReviewForm } from "@/features/review/components/ReviewForm";
import { type TagGroup } from "@/features/tag/types";
import { type ReviewFormPlaceInfo } from "@/features/review/hooks/useReviewForm";

type EditPlaceReviewClientProps = {
  initialReviewData: ReviewFormPlaceInfo;
  tagGroups: TagGroup[];
  closeHref: string;
};

export function EditPlaceReviewClient({
  initialReviewData,
  tagGroups,
  closeHref,
}: EditPlaceReviewClientProps) {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      <ReviewForm
        mode="edit"
        place={initialReviewData}
        tagGroups={tagGroups}
        onClose={() => router.push(closeHref)}
        onSuccess={() => router.push(closeHref)}
      />
    </div>
  );
}
