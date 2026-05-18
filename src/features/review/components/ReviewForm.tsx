"use client";

import React from "react";

import { Search, MapPin } from "lucide-react";
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
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { GooglePlacePhotoAttribution } from "@/features/places/googlePlaces";

import { useReviewForm } from "../hooks/useReviewForm";

interface PlaceInfo {
  id?: string;
  name: string;
  address: string;
}

interface ReviewFormProps {
  place?: PlaceInfo;
  tagGroups?: TagGroup[];
  onClose: () => void;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <FormLabel className="m-0 text-sm font-bold">{children}</FormLabel>
);

function formatDistance(distanceMeters: number | null) {
  if (distanceMeters === null) {
    return null;
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

function formatDuration(durationSeconds: number | null | undefined) {
  if (durationSeconds == null) {
    return null;
  }

  const minutes = Math.max(1, Math.round(durationSeconds / 60));

  return `${minutes}分`;
}

function normalizeAttributionUrl(uri: string | null) {
  if (!uri) {
    return null;
  }

  if (uri.startsWith("//")) {
    return `https:${uri}`;
  }

  return uri;
}

function PhotoAttributions({ attributions }: { attributions: GooglePlacePhotoAttribution[] }) {
  if (attributions.length === 0) {
    return null;
  }

  return (
    <p className="text-xs leading-snug text-slate-500">
      Photo:{" "}
      {attributions.map((attribution, index) => {
        const href = normalizeAttributionUrl(attribution.uri);
        const separator = index > 0 ? ", " : "";

        return href ? (
          <React.Fragment key={`${attribution.displayName}-${index}`}>
            {separator}
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              {attribution.displayName}
            </a>
          </React.Fragment>
        ) : (
          <React.Fragment key={`${attribution.displayName}-${index}`}>
            {separator}
            {attribution.displayName}
          </React.Fragment>
        );
      })}
    </p>
  );
}

export function ReviewForm({ place, tagGroups, onClose }: ReviewFormProps) {
  const { state, handlers } = useReviewForm(place, tagGroups);
  const isNewShop = !place;
  const showSuggestions = isNewShop && state.placeSuggestions.length > 0;
  const showEmptyPlaceResult =
    isNewShop &&
    state.placeSearchInput.trim().length >= 2 &&
    !state.selectedPlace &&
    !state.isSearchingPlaces &&
    !state.placeSearchError &&
    state.placeSuggestions.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* フォーム中身：スクロールエリア */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
        {/* 1. お店検索エリア */}
        {isNewShop && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 z-5 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="お店を検索..."
                value={state.placeSearchInput}
                onChange={(event) => handlers.setPlaceSearch(event.target.value)}
                autoComplete="off"
                className="border-slate-300 pl-10 placeholder:text-slate-950"
              />
            </div>
            {state.isSearchingPlaces && (
              <p className="text-sm font-medium text-slate-500">候補を検索中...</p>
            )}
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
            {state.isLoadingPlaceDetails && (
              <p className="text-sm font-medium text-slate-500">お店の詳細を取得中...</p>
            )}
            {state.placeDetailsError && (
              <p className="text-sm font-medium text-red-500">{state.placeDetailsError}</p>
            )}
            {state.errors.place && (
              <p className="text-destructive text-sm font-medium text-red-500">
                {state.errors.place}
              </p>
            )}
          </div>
        )}

        {/* 2. 店舗情報表示 */}
        {state.selectedPlace && (
          <div className="border-primary flex flex-col gap-4 rounded-xl border px-4 py-5 shadow-sm">
            {state.selectedPlace.imageUrl && (
              <div className="flex flex-col gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={state.selectedPlace.imageUrl}
                  alt=""
                  className="aspect-4/3 w-full rounded-lg object-cover"
                />
                <PhotoAttributions attributions={state.selectedPlace.photoAttributions ?? []} />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <h2 className="text-primary text-base leading-none font-bold">
                {state.selectedPlace.name}
              </h2>
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin size={16} className="text-primary shrink-0" strokeWidth={1.5} />
                <p className="text-sm leading-snug font-medium">
                  {state.selectedPlace.address ?? "-"}
                </p>
              </div>
            </div>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-2 text-xs text-slate-600">
              <dt className="font-bold text-slate-900">google_place_id</dt>
              <dd className="break-all">{state.selectedPlace.googlePlaceId ?? "-"}</dd>
              <dt className="font-bold text-slate-900">category</dt>
              <dd>{state.selectedPlace.category ?? "-"}</dd>
              <dt className="font-bold text-slate-900">lat</dt>
              <dd>{state.selectedPlace.lat ?? "-"}</dd>
              <dt className="font-bold text-slate-900">lng</dt>
              <dd>{state.selectedPlace.lng ?? "-"}</dd>
              <dt className="font-bold text-slate-900">image_url</dt>
              <dd className="break-all">{state.selectedPlace.imageUrl ?? "-"}</dd>
              <dt className="font-bold text-slate-900">distance</dt>
              <dd>{formatDistance(state.selectedPlace.distanceFromOfficeMeters ?? null) ?? "-"}</dd>
              <dt className="font-bold text-slate-900">walking</dt>
              <dd>{formatDuration(state.selectedPlace.walkingDurationSeconds) ?? "-"}</dd>
            </dl>
          </div>
        )}

        {/* 3. レート選択 */}
        <FormItem className="flex flex-col gap-3">
          <SectionTitle>
            レート<span className="text-red-500">*</span>
          </SectionTitle>
          <StarRating rating={state.rating} size={24} onSelect={handlers.setRating} />
          <FormMessage>{state.errors.rating}</FormMessage>
        </FormItem>

        {/* 4. タグ */}
        <div className="flex flex-col gap-3">
          <SectionTitle>タグ</SectionTitle>

          <PriceSelector value={state.priceRange} onChange={handlers.setPriceRange} />
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
        <FormItem>
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
      <div className="flex flex-none flex-row gap-2 border-t border-slate-200 bg-slate-50 p-4">
        <Button variant="outline" className="h-11 flex-1 rounded-lg text-base" onClick={onClose}>
          キャンセル
        </Button>
        <Button
          className="bg-primary-linear h-11 flex-1 rounded-lg text-base text-white"
          disabled={state.isPending}
          onClick={() => handlers.onSubmit(onClose)}
        >
          {state.isPending ? "送信中..." : "レビューを投稿する"}
        </Button>
      </div>
      {state.errors.submit && (
        <p className="bg-slate-50 px-4 pb-4 text-sm font-medium text-red-500">
          {state.errors.submit}
        </p>
      )}
    </div>
  );
}
