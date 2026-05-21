"use client";

import React from "react";

import Image from "next/image";
import { LoaderCircle, MapPin, Search } from "lucide-react";
import { GoogleMapsAttribution } from "@/components/google-maps/GoogleMapsAttribution";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Calendar } from "@/components/ui/Calendar";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/Form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { StarRating } from "@/features/review/components/StarRating";
import { PriceSelector } from "./PriceSelector";
import { CategorizedTags } from "@/features/tag/components/CategorizedTags";
import type { TagGroup } from "@/features/tag/types";
import { Tag } from "@/components/ui/Tag";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { SignedGooglePlaceDetails } from "@/features/places/googlePlaces";
import type { Place } from "@/features/places/types";
import PlaceCard from "@/features/places/components/PlaceCard";
import type { ExistingReviewPlaceMatch } from "@/features/review/actions";

import {
  useReviewForm,
  type ReviewFormMode,
  type ReviewFormPlaceInfo,
} from "../hooks/useReviewForm";
import { Footer } from "@/components/ui/Footer";

interface ReviewFormProps {
  mode: ReviewFormMode;
  place?: ReviewFormPlaceInfo;
  tagGroups?: TagGroup[];
  onClose: () => void;
  onSuccess: (placeId: string) => void;
  onExistingPlaceMatch?: (place: ExistingReviewPlaceMatch) => void;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <FormLabel className="m-0 text-sm font-bold">{children}</FormLabel>
);

type ReviewFormSelectedPlace = ReviewFormPlaceInfo | SignedGooglePlaceDetails;

function formatDistance(distanceMeters: number | null) {
  if (distanceMeters === null) {
    return null;
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

function ExistingPlaceMatchPrompt({
  place,
  onConfirm,
  onCancel,
}: {
  place: ExistingReviewPlaceMatch;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-950">
          このお店はすでに登録されています。既存のお店にレビューを書きますか？
        </p>
        <p className="text-sm text-slate-600">{place.name}</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" className="h-9 flex-1" onClick={onConfirm}>
          レビューを書く
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-9 flex-1" onClick={onCancel}>
          別のお店を探す
        </Button>
      </div>
    </div>
  );
}

function toPlaceCardPlace(place: ReviewFormSelectedPlace): Place {
  const id = "id" in place ? place.id : place.googlePlaceId;
  const lat = typeof place.lat === "number" ? place.lat : 0;
  const lng = typeof place.lng === "number" ? place.lng : 0;

  return {
    id,
    googlePlaceId: place.googlePlaceId ?? id,
    name: place.name,
    category: place.category ?? null,
    price_range: "price_range" in place ? (place.price_range ?? null) : null,
    lat,
    lng,
    imageUrl: place.imageUrl ?? null,
    photoAttributions: place.photoAttributions ?? [],
    isGochimeshi: "isGochimeshi" in place ? (place.isGochimeshi ?? false) : false,
    avgRating: "avgRating" in place ? (place.avgRating ?? 0) : 0,
    reviewCount: "reviewCount" in place ? (place.reviewCount ?? 0) : 0,
    distanceFromOfficeMeters: place.distanceFromOfficeMeters ?? null,
    walkingDurationSeconds: place.walkingDurationSeconds ?? null,
    isBookmarked: "isBookmarked" in place ? (place.isBookmarked ?? false) : false,
    bookmarkCount: "bookmarkCount" in place ? (place.bookmarkCount ?? 0) : 0,
  };
}

function ReviewFormPlaceCard({
  place,
  hideBookmark = false,
}: {
  place: ReviewFormSelectedPlace;
  hideBookmark?: boolean;
}) {
  const cardPlace = toPlaceCardPlace(place);
  const preventCardNavigation: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    event.preventDefault();
  };

  return (
    <ul
      className={`list-none p-0 [&_a]:cursor-default ${hideBookmark ? "[&_button]:hidden" : ""}`}
      onClickCapture={(event) => event.preventDefault()}
    >
      <PlaceCard
        place={cardPlace}
        isSelected={false}
        onClick={preventCardNavigation}
        placeDetailHref="#"
      />
    </ul>
  );
}

function NewPlaceReviewFormCard({ place }: { place: ReviewFormSelectedPlace }) {
  const address = place.address?.trim() || "住所未設定";

  return (
    <div>
      <div className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-4">
          {place.imageUrl ? (
            <Image
              src={place.imageUrl}
              alt="お店の写真"
              width={96}
              height={96}
              className="aspect-square shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex size-24 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <MapPin className="size-7" aria-hidden="true" />
              <span className="sr-only">お店の写真なし</span>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="min-w-0">
              <p className="line-clamp-1 text-left text-lg font-semibold break-words text-slate-950">
                {place.name}
              </p>
              <div className="mt-1 flex items-start gap-1.5 text-slate-500">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <p className="line-clamp-2 text-sm leading-snug break-words">{address}</p>
              </div>
            </div>

            {place.category ? (
              <div className="inline-flex gap-1">
                <Tag variant="primary">{place.category}</Tag>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <GoogleMapsAttribution className="mt-2" />
    </div>
  );
}

export function ReviewForm({
  mode,
  place,
  tagGroups,
  onClose,
  onSuccess,
  onExistingPlaceMatch,
}: ReviewFormProps) {
  const { state, handlers } = useReviewForm({
    mode,
    place,
    tagGroups,
    onExistingPlaceMatch,
  });
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const handledValidationAttemptRef = React.useRef(0);
  const placeSectionRef = React.useRef<HTMLDivElement>(null);
  const ratingSectionRef = React.useRef<HTMLDivElement>(null);
  const priceRangeSectionRef = React.useRef<HTMLDivElement>(null);
  const commentSectionRef = React.useRef<HTMLDivElement>(null);
  const isNewShop = mode === "new-place";
  const isPlaceSearchLoading = state.isSearchingPlaces || state.isLoadingPlaceDetails;
  const showSuggestions = isNewShop && state.placeSuggestions.length > 0;
  const showEmptyPlaceResult =
    isNewShop &&
    state.placeSearchInput.trim().length >= 2 &&
    !state.selectedPlace &&
    !state.isSearchingPlaces &&
    !state.placeSearchError &&
    state.placeSuggestions.length === 0;

  React.useEffect(() => {
    if (
      state.validationAttemptCount === 0 ||
      handledValidationAttemptRef.current === state.validationAttemptCount
    ) {
      return;
    }

    handledValidationAttemptRef.current = state.validationAttemptCount;

    const firstErrorTarget =
      (state.errors.place && placeSectionRef.current) ||
      (state.errors.rating && ratingSectionRef.current) ||
      (state.errors.priceRange && priceRangeSectionRef.current) ||
      (state.errors.comment && commentSectionRef.current) ||
      null;
    const scrollArea = scrollAreaRef.current;

    if (!firstErrorTarget || !scrollArea) {
      return;
    }

    window.requestAnimationFrame(() => {
      const scrollAreaRect = scrollArea.getBoundingClientRect();
      const targetRect = firstErrorTarget.getBoundingClientRect();
      const nextScrollTop = scrollArea.scrollTop + targetRect.top - scrollAreaRect.top - 16;

      scrollArea.scrollTo({
        top: Math.max(0, nextScrollTop),
        behavior: "smooth",
      });
    });
  }, [state.errors, state.validationAttemptCount]);

  return (
    <div className="flex h-full flex-col">
      {/* フォーム中身：スクロールエリア */}
      <div
        ref={scrollAreaRef}
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pt-4"
      >
        {/* 1. お店検索エリア */}
        {isNewShop && (
          <div ref={placeSectionRef} className="space-y-2">
            <div className="relative">
              {isPlaceSearchLoading ? (
                <LoaderCircle
                  className="absolute top-1/2 left-3 z-5 h-5 w-5 -translate-y-1/2 animate-spin text-gray-400"
                  aria-label="読み込み中"
                />
              ) : (
                <Search
                  className="absolute top-1/2 left-3 z-5 h-5 w-5 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
              )}
              <Input
                placeholder="お店を検索..."
                value={state.placeSearchInput}
                onChange={(event) => handlers.setPlaceSearch(event.target.value)}
                autoComplete="off"
                className="border-slate-300 pl-10 placeholder:text-slate-950"
              />
            </div>
            {state.placeSearchError && (
              <p className="text-sm font-medium text-red-500">{state.placeSearchError}</p>
            )}
            {showEmptyPlaceResult && (
              <p className="text-sm font-medium text-slate-500">
                該当するお店が見つかりませんでした。
              </p>
            )}
            {showSuggestions && (
              <ul className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                {state.placeSuggestions.map((suggestion) => {
                  const distance = formatDistance(suggestion.distanceMeters);

                  return (
                    <li
                      key={suggestion.placeId}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <button
                        type="button"
                        className="flex w-full flex-col gap-1 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                        onClick={() => {
                          void handlers.selectPlaceSuggestion(suggestion);
                        }}
                      >
                        <span className="text-sm font-bold text-slate-900">
                          {suggestion.mainText}
                        </span>
                        <span className="text-xs text-slate-500">
                          {suggestion.secondaryText}
                          {distance ? ` ・ ${distance}` : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {state.placeDetailsError && (
              <p className="text-sm font-medium text-red-500">{state.placeDetailsError}</p>
            )}
            {state.existingPlaceMatch && (
              <ExistingPlaceMatchPrompt
                place={state.existingPlaceMatch}
                onConfirm={handlers.confirmExistingPlaceMatch}
                onCancel={handlers.clearSelectedPlaceForSearch}
              />
            )}
            {state.errors.place && (
              <p className="text-destructive text-sm font-medium text-red-500">
                {state.errors.place}
              </p>
            )}
          </div>
        )}

        {/* 2. 店舗情報表示 */}
        {state.selectedPlace ? (
          isNewShop ? (
            <NewPlaceReviewFormCard place={state.selectedPlace} />
          ) : (
            <ReviewFormPlaceCard place={state.selectedPlace} hideBookmark />
          )
        ) : null}

        {/* 3. レート選択 */}
        <FormItem ref={ratingSectionRef} className="flex flex-col gap-3">
          <SectionTitle>
            レート<span className="text-red-500">*</span>
          </SectionTitle>
          <StarRating rating={state.rating} size={24} onSelect={handlers.setRating} />
          <FormMessage>{state.errors.rating}</FormMessage>
        </FormItem>

        {/* 4. タグ */}
        <div ref={priceRangeSectionRef} className="flex flex-col gap-3">
          <SectionTitle>タグ</SectionTitle>

          <PriceSelector value={state.priceRange} required onChange={handlers.setPriceRange} />
          {state.errors.priceRange && (
            <p className="text-sm font-medium text-red-500">{state.errors.priceRange}</p>
          )}
          {state.groupedTags.map((cat) => (
            <div key={cat.category.id}>
              <CategorizedTags
                categoryName={cat.category.name}
                tags={cat.tags}
                selectedTags={state.selectedTags}
                onTagToggle={(tag) => handlers.handleTagToggle(tag)}
              />
            </div>
          ))}
        </div>

        {/* 5. 訪問日 */}
        <div className="flex flex-col gap-3">
          <SectionTitle>場所を訪問した日</SectionTitle>
          <Popover>
            <PopoverTrigger asChild>
              <div className="w-full">
                <Input
                  readOnly
                  value={
                    state.visitDate
                      ? format(state.visitDate, "yyyy/MM/dd(eee)", { locale: ja })
                      : ""
                  }
                  placeholder="日付を選択してください"
                  className="text-medium focus:border-primary w-full cursor-pointer border-slate-400 bg-white px-4 py-2 text-sm text-slate-700 focus:ring-0"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="z-50 w-auto border border-slate-200 bg-white p-0 shadow-xl"
              align="start"
            >
              <Calendar mode="single" selected={state.visitDate} onSelect={handlers.setVisitDate} />
            </PopoverContent>
          </Popover>
        </div>

        {/* 6. コメント */}
        <FormItem ref={commentSectionRef}>
          <SectionTitle>コメント</SectionTitle>
          <FormControl>
            <Textarea
              placeholder="店の感想を書いてください"
              value={state.comment}
              onChange={(e) => handlers.setComment(e.target.value)}
            />
          </FormControl>
          <FormMessage>{state.errors.comment}</FormMessage>
        </FormItem>
      </div>

      {/* 7. フッターボタン */}

      <Footer
        onCancel={onClose}
        onSubmit={() => handlers.onSubmit(onSuccess)}
        isPending={state.isPending}
        disabled={state.isSubmitDisabled}
        submitText="レビューを投稿する"
        submitError={state.errors.submit}
      />
    </div>
  );
}
