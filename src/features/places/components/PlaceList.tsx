"use client";

import { useMapMarkerStore } from "@/stores";
import type { Place } from "@/features/places/types";
import PlaceCard from "./PlaceCard";

type PlaceListProps = {
  places: Place[];
  placeDetailHrefs: Record<string, string>;
};

export function PlaceList({ places, placeDetailHrefs }: PlaceListProps) {
  const selectedPlaceId = useMapMarkerStore((state) => state.selectedMarkerId);
  const selectPlace = useMapMarkerStore((state) => state.selectMarker);

  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center p-2 py-30">
        <p className="text-sm text-slate-500">お店が見つかりませんでした</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-1 flex-col gap-3 overflow-y-auto text-sm">
      {places.map((place) => {
        const isSelected = selectedPlaceId === place.id;

        return (
          <PlaceCard
            key={place.id}
            place={place}
            isSelected={isSelected}
            onClick={() => selectPlace(place.id)}
            placeDetailHref={placeDetailHrefs[place.id] ?? "/home/places"}
          />
        );
      })}
    </ul>
  );
}
