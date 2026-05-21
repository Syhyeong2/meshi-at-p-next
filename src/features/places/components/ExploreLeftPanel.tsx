"use client";

import React, { useState } from "react";
import { Check, ChevronDown, RotateCcw, Search, SlidersHorizontal, Star } from "lucide-react";
import { PlaceList } from "@/features/places/components/PlaceList";
import { FilterList } from "./FilterList";
import { Input } from "@/components/ui/Input";
import type { Place } from "@/features/places/types";
import { TagButton } from "@/components/ui/TagButton";
import { Checkbox } from "@/components/ui/Checkbox";
import { useFilterNavigation } from "../hooks/useFilterNavigation";
import { Paginator } from "@/components/ui/Paginator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import type { PlaceSort } from "@/features/places/actions";

// 価格帯の表示ラベル用マスター
const PRICE_LEVELS = [
  { value: 1, label: "〜¥1,000" },
  { value: 2, label: "¥1,000〜¥3,000" },
  { value: 3, label: "¥3,000〜¥5,000" },
  { value: 4, label: "¥5,000〜¥10,000" },
  { value: 5, label: "¥10,000〜" },
];
const GOOGLE_PLACE_CATEGORIES = {
  CAFE: "カフェ",
  SUSHI: "寿司",
  RAMEN: "ラーメン",
  CHINESE: "中華",
  CURRY: "カレー",
  IZAKAYA: "居酒屋",
  SWEETS: "スイーツ",
  BAR: "バー",
  JAPANESE: "和食",
  YAKINIKU: "焼肉",
  WESTERN: "洋食",
  FAST_FOOD: "ファストフード",
  ASIAN: "アジア",
  OTHERS: "その他",
};

const PLACE_SORT_OPTIONS: { label: string; value: PlaceSort }[] = [
  { label: "レビュー評価順", value: "rating" },
  { label: "レビュー数順", value: "review_count" },
  { label: "距離が近い順", value: "distance" },
];

interface ExploreLeftPanelProps {
  places: Place[];
  pagination: {
    page: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    totalCount: number;
  };
  newPlaceReviewHref: string;
  placeDetailHrefs: Record<string, string>;
}

export function ExploreLeftPanel({ places, pagination, placeDetailHrefs }: ExploreLeftPanelProps) {
  const [activeView, setActiveView] = useState<"list" | "filter">("list");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const {
    keyword,
    rating,
    price,
    selectedCategories,
    isGochimeshi,
    sort,
    listQueryString,
    selectedTags,
    searchByKeyword,
    setRating,
    setPrice,
    setSort,
    toggleCategorySelection,
    toggleGochimeshi,
    toggleTagSelection,
  } = useFilterNavigation();

  // 現在の価格帯とカテゴリーのラベルを取得
  const currentPriceLevel = PRICE_LEVELS.find((level) => level.value === price);
  // 表示判定用のフラグ（カテゴリー配列に中身があるかチェック）
  const hasActiveFilters =
    price !== null || rating > 0 || selectedCategories.length > 0 || selectedTags.length > 0;

  const [inputValue, setInputValue] = useState(keyword);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchByKeyword(e.currentTarget.value);
    }
  };

  const handleClear = () => {
    setInputValue(""); // 入力欄を白紙に戻す
    searchByKeyword(""); // URLも完全に初期状態へリセット！
  };

  const currentSortLabel =
    PLACE_SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "レビュー評価順";

  const changeSort = (nextSort: PlaceSort) => {
    setSortMenuOpen(false);

    if (nextSort !== sort) {
      setSort(nextSort);
    }
  };

  const activeBadges = [
    // 星評価（レート）
    ...(rating > 0
      ? [
          {
            id: "filter-rating",
            tagColor: "secondary_outline" as const,
            onClick: () => setRating(0),
            content: (
              <>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{rating}.0 〜</span>
              </>
            ),
          },
        ]
      : []),

    // 価格帯
    ...(price !== null && currentPriceLevel
      ? [
          {
            id: "filter-price",
            tagColor: "neutral" as const,
            onClick: () => setPrice(null),
            content: <span>{currentPriceLevel.label}</span>,
          },
        ]
      : []),

    // カテゴリー（複数）
    ...selectedCategories.map((catKey) => ({
      id: `filter-cat-${catKey}`,
      tagColor: "primary" as const,
      onClick: () => toggleCategorySelection(catKey),
      content: <span>{GOOGLE_PLACE_CATEGORIES[catKey]}</span>,
    })),

    // カスタムタグ（複数）
    ...selectedTags.map((tag) => {
      const tagColorMap: Record<
        string,
        | "primary"
        | "secondary"
        | "tertiary"
        | "neutral"
        | "primary_outline"
        | "secondary_outline"
        | "tertiary_outline"
        | "neutral_outline"
      > = {
        "95731a4f-8b6c-4272-a218-0a3515e10c02": "secondary",
        "78fb8ac4-8ec6-4f56-b59a-6739614be5c4": "tertiary",
        "a93848dc-14bf-434e-a84f-4d11b2a7b527": "neutral",
      };
      const determinedColor = tag.categoryId ? tagColorMap[tag.categoryId] : "neutral";

      return {
        id: `filter-tag-${tag.id}`,
        tagColor: determinedColor || "neutral",
        onClick: () => toggleTagSelection(tag),
        content: (
          <>
            {tag.emoji && <span className="mr-0.5">{tag.emoji}</span>}
            <span>{tag.name}</span>
          </>
        ),
      };
    }),
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      {/* タイトルと検索バー・ボタン */}
      <div className="flex flex-col gap-4 border-b border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="bg-primary-linear bg-clip-text text-4xl font-black text-transparent select-none">
            Meshi At Play
          </h1>
        </div>

        <div className="flex w-full items-center gap-2">
          <div className="relative flex-1" key={keyword}>
            <Search className="absolute top-1/2 left-3 z-5 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="お店を検索..."
              autoComplete="off"
              defaultValue={keyword}
              onKeyDown={handleKeyDown}
              onChange={handleChange}
              className="border-slate-300 py-2 pr-4 pl-10 placeholder:text-slate-950"
            />
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center justify-center rounded-lg p-2 text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700"
            title="検索をクリア"
            style={{ cursor: "pointer" }}
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>
      {/* フィルターヘッダー */}
      <div
        onClick={() => setActiveView(activeView === "list" ? "filter" : "list")}
        className="flex cursor-pointer flex-row items-center justify-between border-b border-slate-200 bg-white p-4 transition-colors duration-150 select-none hover:bg-slate-50"
      >
        <div className="flex flex-row items-center gap-3">
          <SlidersHorizontal className="text-primary h-5 w-5" />
          <span className="text-sm font-bold text-slate-950">フィルター</span>
        </div>

        <span className="flex h-auto w-16 shrink-0 items-center justify-end p-0 text-sm font-medium text-slate-500">
          {activeView === "list" ? "開く" : "閉じる"}
        </span>
      </div>

      {/* 選択中のフィルター表示エリア */}
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-4">
        <h3 className="text-primary text-sm font-semibold">選択中のフィルター</h3>
        <div className="flex flex-row items-center gap-2 font-medium text-slate-950">
          <Checkbox
            id="gotimeshi"
            className="border-primary"
            checked={isGochimeshi}
            onCheckedChange={(checked) => toggleGochimeshi(!!checked)}
          />
          <label htmlFor="gotimeshi" className="cursor-pointer text-sm">
            ごちめし利用可
          </label>
        </div>
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-1">
            {activeBadges.map((badge) => (
              <TagButton key={badge.id} tagColor={badge.tagColor} onClick={badge.onClick}>
                {badge.content}
                <span className="ml-1 font-bold text-slate-400">×</span>
              </TagButton>
            ))}
          </div>
        )}
      </div>
      {/* 動的コンテンツエリア */}
      {activeView === "filter" ? (
        <div className="flex-1 overflow-y-auto p-5">
          <FilterList onClose={() => setActiveView("list")} />
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-4 pb-3">
              <p className="min-w-0 text-sm font-semibold text-slate-950">
                お店一覧 ({pagination.totalCount}件)
              </p>
              <Popover open={sortMenuOpen} onOpenChange={setSortMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    {currentSortLabel}
                    <ChevronDown className="size-3.5" aria-hidden="true" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="z-30 w-36 gap-1 border border-slate-200 bg-white p-1 shadow-xl"
                >
                  {PLACE_SORT_OPTIONS.map((option) => {
                    const isSelected = sort === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`flex h-9 w-full items-center justify-between rounded-md px-2.5 text-left text-xs font-bold transition-colors ${
                          isSelected
                            ? "bg-slate-100 text-slate-950"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                        }`}
                        onClick={() => changeSort(option.value)}
                      >
                        {option.label}
                        {isSelected ? <Check className="size-3.5" aria-hidden="true" /> : null}
                      </button>
                    );
                  })}
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-3">
              <PlaceList places={places} placeDetailHrefs={placeDetailHrefs} />
            </div>
          </div>
          <Paginator pagination={pagination} baseUrl="/home/places" queryString={listQueryString} />
        </>
      )}
    </div>
  );
}
