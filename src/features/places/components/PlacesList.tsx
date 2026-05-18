"use client";

import Link from "next/link";

import { useMapMarkerStore } from "@/stores";
import type { Place } from "@/features/places/types";

type PlacesListProps = {
  places: Place[];
  placeDetailHrefs: Record<string, string>;
};

export function PlacesList({ places, placeDetailHrefs }: PlacesListProps) {
  const selectedPlaceId = useMapMarkerStore((state) => state.selectedMarkerId);
  const selectPlace = useMapMarkerStore((state) => state.selectMarker);

  if (places.length === 0) {
    return (
      <div className="p-2 text-sm">
        <p>お店が見つかりませんでした</p>
        <p>please refresh or contact admin(change please)</p>
      </div>
    );
  }

  return (
    <ul className="min-h-0 flex-1 basis-0 overflow-y-auto text-sm">
      {places.map((place) => {
        const isSelected = selectedPlaceId === place.id;

        return (
          <li key={place.id} className="border-b border-slate-200 py-3">
            <Link
              href={placeDetailHrefs[place.id] ?? "/home/places"}
              scroll={false}
              aria-current={isSelected ? "true" : undefined}
              onClick={() => selectPlace(place.id)}
              className="text-left font-semibold underline-offset-2 hover:underline"
            >
              {place.name}
              {isSelected ? " (selected)" : ""}
            </Link>

            <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
              <dt>id</dt>
              <dd className="break-all">{place.id}</dd>
              <dt>googlePlaceId</dt>
              <dd className="break-all">{place.googlePlaceId}</dd>
              <dt>category</dt>
              <dd>{place.category ?? "-"}</dd>
              <dt>lat</dt>
              <dd>{place.lat}</dd>
              <dt>lng</dt>
              <dd>{place.lng}</dd>
              <dt>imageUrl</dt>
              <dd className="break-all">{place.imageUrl ?? "-"}</dd>
              <dt>isGochimeshi</dt>
              <dd>{String(place.isGochimeshi)}</dd>
              <dt>avgRating</dt>
              <dd>{place.avgRating}</dd>
              <dt>reviewCount</dt>
              <dd>{place.reviewCount}</dd>
              <dt>distanceFromOfficeMeters</dt>
              <dd>{place.distanceFromOfficeMeters ?? "-"}</dd>
              <dt>walkingDurationSeconds</dt>
              <dd>{place.walkingDurationSeconds ?? "-"}</dd>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
