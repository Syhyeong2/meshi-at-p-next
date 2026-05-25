"use client";

import { useRouter } from "next/navigation";

import { GoogleMap } from "@/components/google-maps";
import { useMapMarkerStore } from "@/stores";

import type { GoogleMapProps } from "./types";

type StoreConnectedGoogleMapProps = Omit<
  GoogleMapProps,
  "markers" | "selectedMarkerId" | "onMarkerSelect"
>;

export function StoreConnectedGoogleMap(props: StoreConnectedGoogleMapProps) {
  const router = useRouter();
  const markers = useMapMarkerStore((state) => state.markers);
  const selectedMarkerId = useMapMarkerStore((state) => state.selectedMarkerId);
  const selectMarker = useMapMarkerStore((state) => state.selectMarker);
  const handleMarkerSelect = (markerId: string) => {
    const marker = markers.find((item) => item.id === markerId);

    selectMarker(markerId);

    if (marker?.href) {
      router.push(marker.href, { scroll: false });
    }
  };

  return (
    <>
      <GoogleMap
        {...props}
        markers={markers}
        selectedMarkerId={selectedMarkerId}
        onMarkerSelect={handleMarkerSelect}
      />
    </>
  );
}
