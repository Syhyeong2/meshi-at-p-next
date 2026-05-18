"use client";

import { create } from "zustand";

import type { GoogleMapMarkerItem } from "@/components/google-maps/types";

export type MapMarkerSource = "places" | "bookmarks" | "review-place";
type MapMarkerLayers = Partial<Record<MapMarkerSource, GoogleMapMarkerItem[]>>;

export type MapMarkerStore = {
  markers: GoogleMapMarkerItem[];
  markerLayers: MapMarkerLayers;
  selectedMarkerId: string | null;
  setMarkers: (source: MapMarkerSource, markers: GoogleMapMarkerItem[]) => void;
  clearMarkers: (source?: MapMarkerSource) => void;
  selectMarker: (markerId: string | null) => void;
};

const MARKER_SOURCE_ORDER: MapMarkerSource[] = ["places", "bookmarks", "review-place"];

function mergeLayers(markerLayers: MapMarkerLayers): GoogleMapMarkerItem[] {
  return MARKER_SOURCE_ORDER.flatMap((source) => markerLayers[source] ?? []);
}

function keepSelection(markers: GoogleMapMarkerItem[], selectedMarkerId: string | null) {
  return markers.some((marker) => marker.id === selectedMarkerId) ? selectedMarkerId : null;
}

export const useMapMarkerStore = create<MapMarkerStore>((set) => ({
  markers: [],
  markerLayers: {},
  selectedMarkerId: null,
  setMarkers: (source, markers) => {
    set((state) => {
      const markerLayers = { ...state.markerLayers, [source]: markers };
      const mergedMarkers = mergeLayers(markerLayers);

      return {
        markers: mergedMarkers,
        markerLayers,
        selectedMarkerId: keepSelection(mergedMarkers, state.selectedMarkerId),
      };
    });
  },
  clearMarkers: (source) => {
    set((state) => {
      if (!source) {
        return {
          markers: [],
          markerLayers: {},
          selectedMarkerId: null,
        };
      }

      if (!state.markerLayers[source]) {
        return state;
      }

      const markerLayers = { ...state.markerLayers };
      delete markerLayers[source];

      const mergedMarkers = mergeLayers(markerLayers);

      return {
        markers: mergedMarkers,
        markerLayers,
        selectedMarkerId: keepSelection(mergedMarkers, state.selectedMarkerId),
      };
    });
  },
  selectMarker: (markerId) => {
    set({ selectedMarkerId: markerId });
  },
}));
