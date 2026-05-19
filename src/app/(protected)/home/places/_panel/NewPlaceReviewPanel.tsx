import { Suspense } from "react";

import { getTagGroupsAction } from "@/features/tag/actions";

import { HomePanelFrame } from "../../_panel/HomePanelFrame";
import { NewPlaceReviewPanelClient } from "./NewPlaceReviewPanelClient";

type NewPlaceReviewPanelProps = {
  closeHref: string;
  page: number;
};

function NewPlaceReviewPanelLoading() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
        <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-24 w-full animate-pulse rounded bg-slate-100" />
        <p className="text-sm text-slate-500">レビュー投稿フォームを読み込んでいます。</p>
      </div>
    </div>
  );
}

async function NewPlaceReviewPanelBody({ closeHref, page }: NewPlaceReviewPanelProps) {
  const tagGroups = await getTagGroupsAction();

  return <NewPlaceReviewPanelClient tagGroups={tagGroups} closeHref={closeHref} page={page} />;
}

export function NewPlaceReviewPanel({ closeHref, page }: NewPlaceReviewPanelProps) {
  return (
    <HomePanelFrame title="レビューを投稿" closeHref={closeHref}>
      <Suspense fallback={<NewPlaceReviewPanelLoading />}>
        <NewPlaceReviewPanelBody closeHref={closeHref} page={page} />
      </Suspense>
    </HomePanelFrame>
  );
}
