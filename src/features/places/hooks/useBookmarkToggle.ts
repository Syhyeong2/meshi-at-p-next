"use client";

import { useTransition } from "react";
import { toggleBookmarkAction } from "@/features/places/actions";

export function useBookmarkToggle(placeId: string, isBookmarked: boolean) {
  const [isPending, startTransition] = useTransition();

  const toggleBookmark = async (e?: React.MouseEvent, onError?: () => void) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    startTransition(async () => {
      try {
        await toggleBookmarkAction(placeId, isBookmarked);
      } catch (error) {
        console.error("Failed to toggle bookmark:", error);
        if (onError) {
          onError();
        }
      }
    });
  };

  return { toggleBookmark, isPending };
}
