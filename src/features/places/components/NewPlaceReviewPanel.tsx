"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

import { ReviewForm } from "@/features/review/components/ReviewForm";
import type { TagGroup } from "@/features/tag/types";

type PanelFrameProps = {
  title: string;
  closeHref: string;
  children: ReactNode;
};

type NewPlaceReviewPanelProps = {
  tagGroups: TagGroup[];
  closeHref: string;
};

type PlaceDetailPanelProps = {
  closeHref: string;
};

function PanelFrame({ title, closeHref, children }: PanelFrameProps) {
  const portalRoot =
    typeof document === "undefined" ? null : document.getElementById("map-overlay-root");

  if (!portalRoot) {
    return null;
  }

  return createPortal(
    <section
      aria-label={title}
      className="pointer-events-auto absolute top-4 bottom-4 left-120 flex w-120 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
    >
      <header className="flex h-14 flex-none items-center justify-between border-b border-slate-200 px-4">
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
        <Link
          href={closeHref}
          replace
          scroll={false}
          aria-label="Close panel"
          className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
        >
          <X className="size-5" aria-hidden="true" />
        </Link>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>,
    portalRoot
  );
}

export function NewPlaceReviewPanel({ tagGroups, closeHref }: NewPlaceReviewPanelProps) {
  const router = useRouter();

  return (
    <PanelFrame title="レビューを投稿" closeHref={closeHref}>
      <ReviewForm
        tagGroups={tagGroups}
        onClose={() => router.replace(closeHref, { scroll: false })}
      />
    </PanelFrame>
  );
}

export function PlaceDetailPanel({ closeHref }: PlaceDetailPanelProps) {
  return (
    <PanelFrame title="お店詳細" closeHref={closeHref}>
      <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500">
        お店詳細パネル
      </div>
    </PanelFrame>
  );
}
