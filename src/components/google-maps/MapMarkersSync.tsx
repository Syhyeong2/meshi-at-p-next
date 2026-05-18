"use client";

import { useEffect } from "react";

import type { GoogleMapMarkerItem } from "@/components/google-maps/types";
import { useMapMarkerStore, type MapMarkerSource } from "@/stores";

type MapMarkersSyncProps = {
  source: MapMarkerSource;
  markers: GoogleMapMarkerItem[];
};

export function MapMarkersSync({ source, markers }: MapMarkersSyncProps) {
  const setMarkers = useMapMarkerStore((state) => state.setMarkers);
  const clearMarkers = useMapMarkerStore((state) => state.clearMarkers);

  useEffect(() => {
    setMarkers(source, markers);
  }, [markers, setMarkers, source]);

  useEffect(() => {
    return () => {
      clearMarkers(source);
    };
  }, [clearMarkers, source]);

  return null;
}
