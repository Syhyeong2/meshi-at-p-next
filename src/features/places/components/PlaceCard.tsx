import React from "react";
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

const PlaceCard = React.forwardRef<HTMLLIElement, Props>(function PlaceCard(
  { place, isSelected, onClick, placeDetailHref },
  ref
) {
  const walkingDurationMinutes = getWalkingDurationMinutes(place.walkingDurationSeconds);
  const distanceLabel =
    place.distanceFromOfficeMeters === null ? "-" : `${place.distanceFromOfficeMeters}m`;

  return (
    <li ref={ref} className="scroll-my-0.5">
      <Link
        href={placeDetailHref}
        scroll={false}
        aria-current={isSelected ? "true" : undefined}
        onClick={onClick}
        className={`inline-flex w-full cursor-pointer items-center gap-4 rounded-xl border p-4 ${isSelected ? "border-primary bg-primary-background" : "border-slate-200"}`}
      >
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
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center">
            <p className="wrab-break-words line-clamp-1 min-w-0 flex-1 text-left text-lg font-semibold">
              {place.name}
            </p>
            <BookmarkButton
              placeId={place.id}
              isBookmarked={place.isBookmarked}
              className="-mr-1"
            />
          </div>
          <div className="inline-flex items-center gap-2">
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
          <div className="inline-flex gap-1">
            {place.category && <Tag variant="primary">{place.category}</Tag>}
            {/* TODO : 価格帯タグデータ */}
            {place.price_range && (
              <Tag variant="neutral">{getPriceRangeLabel(place.price_range)}</Tag>
            )}
            {place.isGochimeshi === true && <Tag variant="neutral">ごちめし可</Tag>}
          </div>
        </div>
      </Link>
    </li>
  );
});

export default PlaceCard;
