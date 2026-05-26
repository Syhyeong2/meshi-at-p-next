import type React from "react";
import type { Place } from "@/features/places/types";
import Image from "next/image";
import { MapPin, SportShoe, Star } from "lucide-react";
import { Tag } from "@/components/ui/Tag";
import Link from "next/link";
import { getPriceRangeLabel, getWalkingDurationMinutes } from "@/lib/utils";
import { BookmarkButton } from "./BookmarkButton";

type Props = {
  place: Place;
  isSelected: boolean;
  onClick: React.MouseEventHandler<HTMLAnchorElement>;
  placeDetailHref: string;
};

export default function PlaceCard({ place, isSelected, onClick, placeDetailHref }: Props) {
  const walkingDurationMinutes = getWalkingDurationMinutes(place.walkingDurationSeconds);
  const distanceLabel =
    place.distanceFromOfficeMeters === null ? "-" : `${place.distanceFromOfficeMeters}m`;

  return (
    <li>
      <Link
        href={placeDetailHref}
        scroll={false}
        aria-current={isSelected ? "true" : undefined}
        onClick={onClick}
        className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border p-3 md:p-4 ${isSelected ? "border-primary bg-primary-background" : "border-slate-200"}`}
      >
        {place.imageUrl ? (
          <div className="relative aspect-square h-20 w-20 md:h-24 md:w-24">
            <Image
              src={place.imageUrl}
              alt="お店の写真"
              fill
              sizes="(max-width: 768px) 96px, 80px"
              className="rounded-lg object-cover"
            />
          </div>
        ) : (
          <div className="flex size-24 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
            <MapPin className="size-7" aria-hidden="true" />
            <span className="sr-only">お店の写真なし</span>
          </div>
        )}
        <div className="flex w-full min-w-0 grow-0 flex-col gap-2">
          <div className="inline-flex h-9 items-center">
            <p className="wrab-break-words line-clamp-1 min-w-0 flex-1 text-left text-lg font-semibold">
              {place.name}
            </p>
            <BookmarkButton
              placeId={place.id}
              isBookmarked={place.isBookmarked}
              className="-mr-1"
            />
          </div>
          <div className="inline-flex items-center gap-1">
            <div className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 stroke-yellow-400" />
              <span className="text-sm font-medium">{place.avgRating}</span>
              <span className="text-sm text-slate-500">({place.reviewCount})</span>
            </div>
            <span className="font-semibold">·</span>
            <div className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-500" />
              <span className="text-sm text-slate-500">{distanceLabel}</span>
            </div>
            <span className="font-semibold">·</span>

            <div className="inline-flex items-center gap-1 text-slate-500">
              <SportShoe className="h-3 w-3" />

              <span className="text-sm">
                {walkingDurationMinutes === null ? (
                  "-"
                ) : (
                  <>
                    {walkingDurationMinutes}
                    <span className="text-xs">分</span>
                  </>
                )}
              </span>
            </div>
          </div>
          <div className="inline-flex w-full gap-1 overflow-x-scroll">
            {place.category && (
              <Tag variant="primary" size="sm">
                {place.category}sasds
              </Tag>
            )}
            {place.isGochimeshi === true && (
              <Tag variant="secondary" size="sm">
                ごちめし利用可
              </Tag>
            )}
            {place.price_range !== null && (
              <Tag variant="neutral" size="sm">
                {getPriceRangeLabel(place.price_range)}
              </Tag>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
