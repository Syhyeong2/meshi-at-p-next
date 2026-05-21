import { Suspense } from "react";
import Link from "next/link";
import { Clock, MapPin, Phone, Star } from "lucide-react";

import { MapMarkersSync } from "@/components/google-maps";
import { GoogleMapsAttribution } from "@/components/google-maps/GoogleMapsAttribution";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import {
  getPlaceAction,
  getPlaceGoogleBusinessDetailsAction,
  getPlacePopularReviewTagsAction,
  getPlaceReviewPreviewsAction,
} from "@/features/places/actions";
import { toPlaceMarker } from "@/features/places/placeMarkers";
import type {
  Place,
  PlaceGoogleBusinessDetails,
  PlacePopularReviewTag,
  PlaceReviewPreview,
} from "@/features/places/types";
import { ReviewCard } from "@/features/review/components/ReviewCard";

import { HomePanelFrame } from "../../_panel/HomePanelFrame";
import Image from "next/image";
import { Footer } from "@/components/ui/Footer";
import { cn, getPriceRangeLabel } from "@/lib/utils";
import { BookmarkButton } from "@/features/places/components/BookmarkButton";

type PlaceDetailPanelProps = {
  closeHref: string;
  placeId: string;
  // 地図マーカーのクリック/選択状態と詳細パネルのURLを合わせるためのhref
  detailHref: string;
  reviewHref: string;
  reviewDetailHref: (reviewId: string) => string;
  reviewsHref: string;
};

function normalizeAttributionUrl(uri: string | null) {
  if (!uri) {
    return null;
  }

  if (uri.startsWith("//")) {
    return `https:${uri}`;
  }

  return uri;
}

function PhotoAttributions({ place }: { place: Place }) {
  if (place.photoAttributions.length === 0) {
    return null;
  }

  return (
    <p className="rounded-lg border border-slate-200 p-2 text-xs leading-snug text-slate-500">
      写真提供:{" "}
      {place.photoAttributions.map((attribution, index) => {
        const href = normalizeAttributionUrl(attribution.uri);
        const separator = index > 0 ? ", " : "";

        return (
          <span key={`${attribution.displayName}-${index}`}>
            {separator}
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {attribution.displayName}
              </a>
            ) : (
              attribution.displayName
            )}
          </span>
        );
      })}
    </p>
  );
}

function getBusinessStatus(details: PlaceGoogleBusinessDetails) {
  // 1. 優先順位が高い特殊な状態からチェック

  switch (details.businessStatus) {
    case "CLOSED_TEMPORARILY":
      return { label: "臨時休業", color: "text-red-500" };
    case "CLOSED_PERMANENTLY":
      return { label: "閉業", color: "text-red-500" };
    case "FUTURE_OPENING":
      return { label: "開業予定", color: "text-blue-500" };

    // 2. 特殊な状態でない場合（OPERATIONALなど）、営業中かどうかを判断
    default:
      if (details.openNow === true) {
        return { label: "営業中", color: "text-green-500" };
      }
      if (details.openNow === false) {
        return { label: "営業時間外", color: "text-red-500" };
      }

      // 3. データがまったくない場合
      return { label: "不明", color: "text-slate-500" };
  }
}

function BusinessInfoSection({
  details,
  placeId,
  isBookmarked,
  bookmarkCount,
}: {
  details: PlaceGoogleBusinessDetails | null;
  placeId: string;
  isBookmarked: boolean;
  bookmarkCount: number;
}) {
  // Google Placesから取得する営業情報エリア。基本의場所情報より後にロードされる場合がある。

  if (!details) return <></>;

  const { label, color } = getBusinessStatus(details);

  return (
    <>
      {details ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <MapPin className="stroke-primary h-4 w-4" />
              <p>{details.address ?? "-"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="stroke-primary h-4 w-4" />
              <p>
                <span className={cn("font-semibold", color)}>{label}</span>{" "}
                <span>{details.todayOpeningHours ?? "営業時間不明"}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="stroke-primary h-4 w-4" />
              <p>
                {details.phoneNumber ? (
                  <a href={`tel:${details.phoneNumber}`} className="underline underline-offset-2">
                    {details.phoneNumber}
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>
          </div>
          <GoogleMapsAttribution className="-mb-1" />
          <div className="flex items-center gap-2">
            <BookmarkButton
              placeId={placeId}
              isBookmarked={isBookmarked}
              bookmarkCount={bookmarkCount}
              variant="extended"
            />

            {details.googleMapsUri ? (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex-1 border-slate-200 text-slate-500"
              >
                <a href={details.googleMapsUri} target="_blank" rel="noreferrer">
                  Google マップで開く
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Google Mapsの店舗情報を取得できませんでした。</p>
      )}
    </>
  );
}

function PopularReviewTagsSection({
  category,
  tags,
  price_range,
  isGochimeshi,
}: {
  category: string | null;
  tags: PlacePopularReviewTag[];
  price_range: number | null;
  isGochimeshi: boolean | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Tag className="h-auto min-h-6 max-w-full px-2.5 py-1 whitespace-normal">
        <span>{category ?? "カテゴリ未設定"}</span>
      </Tag>
      {isGochimeshi && (
        <Tag
          className="h-auto min-h-6 max-w-full px-2.5 py-1 whitespace-normal"
          variant="secondary"
        >
          <span>ごちめし利用可</span>
        </Tag>
      )}
      {price_range && (
        <Tag className="h-auto min-h-6 max-w-full px-2.5 py-1 whitespace-normal" variant="neutral">
          <span>{getPriceRangeLabel(price_range)}</span>
        </Tag>
      )}
      {tags.map((tag) => (
        <Tag
          key={tag.id}
          className="h-auto min-h-6 max-w-full px-2.5 py-1 whitespace-normal"
          variant="tertiary"
        >
          {tag.emoji ? <span>{tag.emoji}</span> : null}
          <span>{tag.name}</span>
        </Tag>
      ))}
    </div>
  );
}

function ReviewPreviewsSection({
  reviews,
  reviewDetailHref,
  reviewsHref,
}: {
  reviews: PlaceReviewPreview[];
  reviewDetailHref: (reviewId: string) => string;
  reviewsHref: string;
}) {
  // 詳細パネル内のレビュープレビューエリア。全レビューへの移動ボタンはまだ無効。
  return (
    <section className="border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between gap-3">
        <h5 className="text-sm font-bold text-slate-950">社員レビュー</h5>
        <Link href={reviewsHref} className="text-primary text-sm hover:underline">
          全てのレビュー
        </Link>
      </div>

      {reviews.length > 0 ? (
        <div className="mt-3 flex flex-col gap-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              id={review.id}
              name={review.authorName}
              rating={review.rating}
              comment={review.comment}
              date={review.date}
              href={reviewDetailHref(review.id)}
              variant="placeDetail"
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 py-20 text-center text-sm text-slate-500">
          まだ社員レビューがありません。
        </p>
      )}
    </section>
  );
}

function PlaceDetailLoading() {
  // 外側のSuspense fallback。ロード中も既存のリストマーカーの選択状態を維持するため、選択状態は変更しない。
  return (
    <>
      <MapMarkersSync source="place-detail" markers={[]} />
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex flex-col gap-4 overflow-y-auto p-6">
          <div className="flex flex-col gap-3">
            {/* Image */}
            <div className="flex flex-col gap-1">
              <div className="aspect-video w-full animate-pulse rounded-lg bg-slate-100" />
              <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
            </div>
            {/* Title */}
            <div className="h-7 w-3/4 animate-pulse rounded-sm bg-slate-100" />
            {/* Rating */}
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
              <div className="h-5 w-10 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
            </div>
          </div>

          <PlaceDetailExtrasLoading />
        </div>
        {/* Footer placeholder */}
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <div className="h-11 w-full animate-pulse rounded-lg bg-slate-100" />
        </div>
      </div>
    </>
  );
}

function PlaceDetailExtrasLoading() {
  // 内側のSuspense fallback。Google情報/タグ/レビューなど、ロードが遅い付加的なセクションのみ代替する。
  return (
    <div className="flex flex-col gap-6">
      {/* Popular Tags */}
      <div className="flex flex-wrap gap-2">
        <div className="h-8 w-24 animate-pulse rounded-md bg-slate-100" />
        <div className="h-8 w-20 animate-pulse rounded-md bg-slate-100" />
        <div className="h-8 w-28 animate-pulse rounded-md bg-slate-100" />
      </div>

      {/* Business Info */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-9 w-full animate-pulse rounded-lg bg-slate-100" />
      </div>

      {/* Review Previews */}
      <section className="border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <div className="h-24 w-full animate-pulse rounded-lg bg-slate-100" />
          <div className="h-24 w-full animate-pulse rounded-lg bg-slate-100" />
        </div>
      </section>
    </div>
  );
}

function PlaceNotFound({ placeId }: { placeId: string }) {
  // 存在しない場所に直接アクセスした場合、詳細専用のマーカーレイヤーも空にする。
  return (
    <>
      <MapMarkersSync source="place-detail" markers={[]} selectedMarkerId={null} />
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
        <div>
          <p>お店が見つかりませんでした。</p>
          <p className="mt-2 break-all">ID: {placeId}</p>
        </div>
      </div>
    </>
  );
}

async function PlaceDetailExtras({
  placeId,
  category,
  price_range,
  isGochimeshi,
  isBookmarked,
  bookmarkCount,
  reviewDetailHref,
  reviewsHref,
}: {
  placeId: string;
  category: string | null;
  price_range: number | null;
  isGochimeshi: boolean | null;
  isBookmarked: boolean;
  bookmarkCount: number;
  reviewDetailHref: (reviewId: string) => string;
  reviewsHref: string;
}) {
  // 付加情報(Google情報/タグ/レビュー)는並列でロードする。
  const [googleBusinessDetails, popularReviewTags, reviewPreviews] = await Promise.all([
    getPlaceGoogleBusinessDetailsAction(placeId),
    getPlacePopularReviewTagsAction(placeId),
    getPlaceReviewPreviewsAction(placeId),
  ]);

  return (
    <>
      <PopularReviewTagsSection
        category={category}
        tags={popularReviewTags}
        price_range={price_range}
        isGochimeshi={isGochimeshi}
      />
      <BusinessInfoSection
        details={googleBusinessDetails}
        placeId={placeId}
        isBookmarked={isBookmarked}
        bookmarkCount={bookmarkCount}
      />
      <ReviewPreviewsSection
        reviews={reviewPreviews}
        reviewDetailHref={reviewDetailHref}
        reviewsHref={reviewsHref}
      />
    </>
  );
}

async function PlaceDetailBody({
  placeId,
  detailHref,
  reviewHref,
  reviewDetailHref,
  reviewsHref,
}: {
  placeId: string;
  detailHref: string;
  reviewHref: string;
  reviewDetailHref: (reviewId: string) => string;
  reviewsHref: string;
}) {
  // 初回画面に必要な基本の場所データのみをここでロードする。
  const place = await getPlaceAction(placeId);

  if (!place) {
    return <PlaceNotFound placeId={placeId} />;
  }

  const marker = {
    ...toPlaceMarker(place),
    href: detailHref,
  };

  return (
    <>
      {/* リストページにない場所に直接アクセスしても地図上で選択した場所が表示されるよう、別レイヤーに登録する。 */}
      <MapMarkersSync source="place-detail" markers={[marker]} selectedMarkerId={place.id} />
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex flex-col gap-4 overflow-y-auto p-6">
          <div className="flex flex-col gap-3">
            {/* 代表画像エリア。デザイン変更時はattributionテキストまで一連のセットとして扱う。 */}
            {place.imageUrl ? (
              <div className="flex flex-col gap-1">
                {}
                <Image
                  src={place.imageUrl}
                  alt={`${place.name}の写真`}
                  className="aspect-video w-full rounded-lg object-cover"
                  width={430}
                  height={243}
                />
                <PhotoAttributions place={place} />
              </div>
            ) : null}
            <h4 className="wrap-break-words text-lg font-bold text-slate-950">{place.name}</h4>

            {/* 基本情報エリア。このブロックは付加情報のロードとは独立して先に表示される必要がある。 */}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 stroke-yellow-400" />
              <span className="inline-flex items-center gap-1 font-semibold text-slate-950">
                {place.avgRating}
              </span>
              <span className="text-sm text-slate-500">({place.reviewCount}件のレビュー)</span>
            </div>
          </div>

          <Suspense fallback={<PlaceDetailExtrasLoading />}>
            <PlaceDetailExtras
              placeId={place.id}
              category={place.category}
              isGochimeshi={place.isGochimeshi}
              price_range={place.price_range}
              isBookmarked={place.isBookmarked}
              bookmarkCount={place.bookmarkCount}
              reviewDetailHref={reviewDetailHref}
              reviewsHref={reviewsHref}
            />
          </Suspense>
        </div>
        <Footer href={reviewHref} submitText="このお店のレビューを書く" />
      </div>
    </>
  );
}

export function PlaceDetailPanel({
  closeHref,
  placeId,
  detailHref,
  reviewHref,
  reviewDetailHref,
  reviewsHref,
}: PlaceDetailPanelProps) {
  return (
    <HomePanelFrame title="お店詳細" closeHref={closeHref}>
      {/* 場所の切り替え時に以前の詳細内容が残らないよう、placeIdをSuspenseのkeyとして使用する。 */}
      <Suspense key={placeId} fallback={<PlaceDetailLoading />}>
        <PlaceDetailBody
          placeId={placeId}
          detailHref={detailHref}
          reviewHref={reviewHref}
          reviewDetailHref={reviewDetailHref}
          reviewsHref={reviewsHref}
        />
      </Suspense>
    </HomePanelFrame>
  );
}
