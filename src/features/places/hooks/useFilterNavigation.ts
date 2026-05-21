import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { PlaceSort } from "@/features/places/actions";
import { buildPlacesListHref, type BuildPlacesListHrefOptions } from "@/features/places/placeQuery";
import { getTagGroupsAction } from "@/features/tag/actions";
import type { Tag, TagGroup } from "@/features/tag/types";

type GooglePlaceCategoryKey =
  | "CAFE"
  | "SUSHI"
  | "RAMEN"
  | "CHINESE"
  | "CURRY"
  | "IZAKAYA"
  | "SWEETS"
  | "BAR"
  | "JAPANESE"
  | "YAKINIKU"
  | "WESTERN"
  | "FAST_FOOD"
  | "ASIAN"
  | "OTHERS";

function normalizePlaceSort(value: string | null): PlaceSort {
  return value === "review_count" || value === "distance" ? value : "rating";
}

export const useFilterNavigation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const keyword = searchParams.get("keyword") || "";
  const rating = Number(searchParams.get("rating")) || 0;
  const price = searchParams.get("price") ? Number(searchParams.get("price")) : null;
  const isGochimeshi = searchParams.get("gotimeshi") === "true";
  const selectedTagIds = searchParams.getAll("tags");
  const selectedCategories = searchParams.getAll("category") as GooglePlaceCategoryKey[];
  const sort = normalizePlaceSort(searchParams.get("sort"));
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(true);

  const navigateToList = (options: BuildPlacesListHrefOptions) => {
    router.push(buildPlacesListHref(searchParams, options), { scroll: false });
  };

  const getPageHref = (page: number) => buildPlacesListHref(searchParams, { page });

  const searchByKeyword = (nextKeyword: string) => {
    const trimmed = nextKeyword.trim();

    navigateToList({ page: 1, keyword: trimmed || null });
  };

  const setRating = (newRating: number) => {
    navigateToList({ page: 1, rating: newRating > 0 ? newRating : null });
  };

  const setPrice = (newPrice: number | null) => {
    navigateToList({ page: 1, price: newPrice });
  };

  const setSort = (newSort: PlaceSort) => {
    navigateToList({ page: 1, sort: newSort });
  };

  const toggleGochimeshi = (checked: boolean) => {
    navigateToList({ page: 1, gotimeshi: checked });
  };

  const toggleCategorySelection = (categoryKey: GooglePlaceCategoryKey) => {
    const updatedCategories = selectedCategories.includes(categoryKey)
      ? selectedCategories.filter((category) => category !== categoryKey)
      : [...selectedCategories, categoryKey];

    navigateToList({ page: 1, categories: updatedCategories });
  };

  const toggleTagSelection = (tag: Tag) => {
    const updatedTagIds = selectedTagIds.includes(tag.id)
      ? selectedTagIds.filter((id) => id !== tag.id)
      : [...selectedTagIds, tag.id];

    navigateToList({ page: 1, tags: updatedTagIds });
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
    selectedCategories,
    tagGroups,
    selectedTags,
    isTagsLoading,
    getPageHref,
    searchByKeyword,
    setRating,
    setPrice,
    setSort,
    toggleCategorySelection,
    toggleGochimeshi,
    toggleTagSelection,
  };
};
