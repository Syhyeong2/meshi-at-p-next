"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ReviewForm } from "@/features/review/components/ReviewForm";
import type { ReviewFormPlaceInfo } from "@/features/review/hooks/useReviewForm";
import type { TagGroup } from "@/features/tag/types";

type ExistingPlaceReviewPanelClientProps = {
  detailHref: string;
  place: ReviewFormPlaceInfo;
  tagGroups: TagGroup[];
};

export function ExistingPlaceReviewPanelClient({
  detailHref,
  place,
  tagGroups,
}: ExistingPlaceReviewPanelClientProps) {
  const router = useRouter();
  const navigateToDetail = () => {
    router.replace(detailHref, { scroll: false });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none flex-col gap-3 border-b border-slate-100 p-4">
        <Button asChild variant="ghost" size="sm" className="h-8 justify-start gap-2 px-0 text-xs">
          <Link href={detailHref} scroll={false}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            お店詳細に戻る
          </Link>
        </Button>
        <div>
          <p className="text-xs font-bold text-slate-500">レビュー対象</p>
          <h4 className="mt-1 text-lg font-bold break-words text-slate-950">{place.name}</h4>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ReviewForm
          mode="existing-place"
          place={place}
          tagGroups={tagGroups}
          onClose={navigateToDetail}
          onSuccess={navigateToDetail}
        />
      </div>
    </div>
  );
}
