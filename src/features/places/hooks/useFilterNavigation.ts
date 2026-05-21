import { useEffect, useState } from "react";
import { Tag, TagGroup } from "@/features/tag/types";
import { useRouter, useSearchParams } from "next/navigation";
import { getTagGroupsAction } from "@/features/tag/actions";
import type { PlaceSort } from "@/features/places/actions";

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
type GooglePlaceCategoryKey = keyof typeof GOOGLE_PLACE_CATEGORIES;

function normalizePlaceSort(value: string | null): PlaceSort {
  return value === "review_count" || value === "distance" ? value : "rating";
}

export const useFilterNavigation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLから値を取るロジック
  const keyword = searchParams.get("keyword") || "";
  const rating = Number(searchParams.get("rating")) || 0;
  const price = searchParams.get("price") ? Number(searchParams.get("price")) : null;
  const isGochimeshi = searchParams.get("gotimeshi") === "true";
  const selectedTagIds = searchParams.getAll("tags");
  const selectedCategories = searchParams.getAll("category") as GooglePlaceCategoryKey[];
  const sort = normalizePlaceSort(searchParams.get("sort"));
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(true);

  const listQueryString = (() => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("panel");
    params.delete("placeId");
    params.delete("reviewId");

    if (sort === "rating") {
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }

    return params.toString();
  })();

  // URLを更新する共通のヘルパー
  const updateURL = (params: URLSearchParams) => {
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const searchByKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (trimmed) {
      router.push(`?page=1&keyword=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("?page=1");
    }
  };

  // 2. 各更新関数
  const setRating = (newRating: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newRating > 0) params.set("rating", String(newRating));
    else params.delete("rating");
    updateURL(params);
  };

  const setPrice = (newPrice: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPrice) params.set("price", String(newPrice));
    else params.delete("price");
    updateURL(params);
  };

  const toggleGochimeshi = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set("gotimeshi", "true");
    } else {
      params.delete("gotimeshi");
    }
    updateURL(params);
  };

  const toggleCategorySelection = (categoryKey: GooglePlaceCategoryKey) => {
    const params = new URLSearchParams(searchParams.toString());

    // 現在選択されているカテゴリーをすべて取得
    const currentCategories = params.getAll("category");

    if (currentCategories.includes(categoryKey)) {
      // 既に選択されている場合は、URLパラメータから削除
      const updated = currentCategories.filter((c) => c !== categoryKey);
      params.delete("category"); // 一旦全削除してから
      updated.forEach((c) => params.append("category", c)); // 残りを再追加
    } else {
      // 選択されていない場合は、URLパラメータに追加（append）
      params.append("category", categoryKey);
    }

    updateURL(params);
  };

  const setSort = (newSort: PlaceSort) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", "1");

    if (newSort === "rating") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }

    updateURL(params);
  };

  // タグの追加と削除
  const toggleTagSelection = (tag: Tag) => {
    const params = new URLSearchParams(searchParams.toString());
    const tagId = typeof tag === "string" ? tag : tag.id;
    const currentTags = params.getAll("tags");

    if (currentTags.includes(tagId)) {
      const filteredTags = currentTags.filter((id) => id !== tagId);
      params.delete("tags");
      filteredTags.forEach((id) => params.append("tags", id));
    } else {
      params.append("tags", tagId);
    }
    updateURL(params);
  };
  useEffect(() => {
    async function loadTags() {
      try {
        const data = await getTagGroupsAction();
        setTagGroups(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsTagsLoading(false);
      }
    }
    loadTags();
  }, []);

  const flatTags = tagGroups.flatMap((group) => group.tags);
  const selectedTags = flatTags.filter((tag) => selectedTagIds.includes(tag.id));

  return {
    keyword,
    rating,
    price,
    isGochimeshi,
    sort,
    listQueryString,
    selectedCategories,
    tagGroups,
    selectedTags,
    isTagsLoading,
    searchByKeyword,
    setRating,
    setPrice,
    setSort,
    toggleCategorySelection,
    toggleGochimeshi,
    toggleTagSelection,
  };
};
