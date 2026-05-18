"use client";

import { useRouter } from "next/navigation";

import { ReviewForm } from "@/features/review/components/ReviewForm";
import type { TagGroup } from "@/features/tag/types";

import { HomePanelFrame } from "../../_panel/HomePanelFrame";

type NewPlaceReviewPanelProps = {
  tagGroups: TagGroup[];
  closeHref: string;
};

export function NewPlaceReviewPanel({ tagGroups, closeHref }: NewPlaceReviewPanelProps) {
  const router = useRouter();

  return (
    <HomePanelFrame title="レビューを投稿" closeHref={closeHref}>
      <ReviewForm
        tagGroups={tagGroups}
        onClose={() => router.replace(closeHref, { scroll: false })}
      />
    </HomePanelFrame>
  );
}
