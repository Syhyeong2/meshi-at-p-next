"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBookmarkToggle } from "../hooks/useBookmarkToggle";
import { Button } from "@/components/ui/Button";

type Props = {
  placeId: string;
  isBookmarked: boolean;
  bookmarkCount?: number;
  variant?: "icon" | "extended";
  className?: string;
};

export function BookmarkButton({
  placeId,
  isBookmarked: initialIsBookmarked,
  bookmarkCount: initialBookmarkCount = 0,
  variant = "icon",
  className,
}: Props) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(initialBookmarkCount);

  const [prevInitialIsBookmarked, setPrevInitialIsBookmarked] = useState(initialIsBookmarked);
  if (initialIsBookmarked !== prevInitialIsBookmarked) {
    setIsBookmarked(initialIsBookmarked);
    setBookmarkCount(initialBookmarkCount);
    setPrevInitialIsBookmarked(initialIsBookmarked);
  }

  const { toggleBookmark, isPending } = useBookmarkToggle(placeId, isBookmarked);

  const handleToggle = (e: React.MouseEvent) => {
    const nextIsBookmarked = !isBookmarked;
    const prevIsBookmarked = isBookmarked;
    const prevBookmarkCount = bookmarkCount;

    setIsBookmarked(nextIsBookmarked);
    setBookmarkCount((prev) => (nextIsBookmarked ? prev + 1 : Math.max(0, prev - 1)));

    toggleBookmark(e, () => {
      setIsBookmarked(prevIsBookmarked);
      setBookmarkCount(prevBookmarkCount);
    });
  };

  if (variant === "extended") {
    return (
      <Button
        variant="outline"
        onClick={handleToggle}
        disabled={isPending}
        size="sm"
        className={cn("gap-2", isPending && "opacity-50", className)}
        aria-label={isBookmarked ? "ブックマーク解除" : "ブックマーク登録"}
      >
        <Bookmark
          className={cn(
            "h-4 w-4 transition-colors",
            isBookmarked ? "fill-primary stroke-primary" : "text-slate-400"
          )}
        />
        <span
          className={cn("text-sm font-medium", isBookmarked ? "text-primary" : "text-slate-600")}
        >
          {bookmarkCount}
        </span>
      </Button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn("cursor-pointer transition-opacity", isPending && "opacity-50", className)}
      aria-label={isBookmarked ? "ブックマーク解除" : "ブックマーク登録"}
    >
      <Bookmark
        className={cn(
          "h-5 w-5 transition-colors",
          isBookmarked
            ? "fill-primary stroke-primary"
            : "hover:fill-primary-background text-slate-400"
        )}
      />
    </button>
  );
}
