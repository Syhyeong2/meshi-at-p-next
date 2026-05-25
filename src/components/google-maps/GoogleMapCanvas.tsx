"use client";

import { APILoadingStatus, Map, useApiLoadingStatus, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import {
  DEFAULT_GOOGLE_MAP_CENTER,
  DEFAULT_GOOGLE_MAP_CENTER_MARKER,
  DEFAULT_GOOGLE_MAP_OPTIONS,
  DEFAULT_GOOGLE_MAP_ZOOM,
} from "./constants";
import { GoogleMapMarker } from "./GoogleMapMarker";
import { GoogleMapStatusMessage } from "./GoogleMapStatusMessage";
import type {
  GoogleMapMarkerItem,
  GoogleMapPosition,
  GoogleMapProps,
  GoogleMapSelectedMarkerOcclusion,
} from "./types";

const EMPTY_MARKERS: GoogleMapMarkerItem[] = [];
const DEFAULT_LOADING_CONTENT = {
  title: "Loading map",
  message: "Preparing Google Maps.",
};
const DEFAULT_ERROR_CONTENT = {
  title: "Map unavailable",
  message: "Check the Google Maps API settings.",
};

type MarkerClickPanState = {
  markerId: string;
  clientX: number | null;
  clientY: number | null;
};
type GoogleMapInstance = NonNullable<ReturnType<typeof useMap>>;
type GoogleMapProjection = {
  fromLatLngToPoint: (latLng: unknown) => { x: number; y: number } | null;
  fromPointToLatLng: (point: unknown) => { toJSON: () => GoogleMapPosition } | null;
};
type GoogleMapsRuntime = {
  LatLng: new (lat: number, lng: number) => unknown;
  Point: new (x: number, y: number) => unknown;
};

type GoogleMapCanvasProps = Omit<
  GoogleMapProps,
  "apiKey" | "apiVersion" | "language" | "region"
> & {
  loadError: Error | null;
};

export function GoogleMapCanvas({
  mapId,
  markers = EMPTY_MARKERS,
  showDefaultCenterMarker = true,
  selectedMarkerId = null,
  selectedMarkerOcclusion,
  onMarkerSelect,
  defaultCenter = DEFAULT_GOOGLE_MAP_CENTER,
  defaultZoom = DEFAULT_GOOGLE_MAP_ZOOM,
  mapInstanceId = "google-map",
  mapOptions,
  loadingContent = DEFAULT_LOADING_CONTENT,
  errorContent = DEFAULT_ERROR_CONTENT,
  className,
  mapClassName,
  children,
  loadError,
}: GoogleMapCanvasProps) {
  const loadingStatus = useApiLoadingStatus();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markerClickPanStateRef = useRef<MarkerClickPanState | null>(null);

  // 認証失敗も利用者にとってはロード失敗と同じなので、同じフォールバック表示にまとめる。
  const hasLoadError =
    Boolean(loadError) ||
    loadingStatus === APILoadingStatus.FAILED ||
    loadingStatus === APILoadingStatus.AUTH_FAILURE;
  const mergedMapOptions = {
    ...DEFAULT_GOOGLE_MAP_OPTIONS,
    ...mapOptions,
  };
  const mapMarkers = showDefaultCenterMarker
    ? [DEFAULT_GOOGLE_MAP_CENTER_MARKER, ...markers]
    : markers;
  const selectedMarker = mapMarkers.find((marker) => marker.id === selectedMarkerId);
  const handleMarkerSelect = (markerId: string, event: unknown) => {
    const clickPoint = getClientPoint(getDomEvent(event));

    markerClickPanStateRef.current = {
      markerId,
      clientX: clickPoint?.clientX ?? null,
      clientY: clickPoint?.clientY ?? null,
    };
    onMarkerSelect?.(markerId);
  };

  return (
    <div ref={mapContainerRef} className={cn("relative h-full w-full overflow-hidden", className)}>
      {hasLoadError ? (
        <GoogleMapStatusMessage title={errorContent.title} message={errorContent.message} />
      ) : loadingStatus !== APILoadingStatus.LOADED ? (
        <GoogleMapStatusMessage title={loadingContent.title} message={loadingContent.message} />
      ) : null}

      {!hasLoadError ? (
        <Map
          id={mapInstanceId}
          // Advanced Marker には Map ID が必要。reuseMaps と併用して再マウント時の生成コストも抑える。
          mapId={mapId}
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          reuseMaps
          clickableIcons={mergedMapOptions.clickableIcons}
          fullscreenControl={mergedMapOptions.fullscreenControl}
          gestureHandling={mergedMapOptions.gestureHandling}
          mapTypeControl={mergedMapOptions.mapTypeControl}
          streetViewControl={mergedMapOptions.streetViewControl}
          zoomControl={mergedMapOptions.zoomControl}
          className={cn("h-full w-full", mapClassName)}
        >
          <GoogleMapSelectedMarkerPan
            marker={selectedMarker}
            markerClickPanStateRef={markerClickPanStateRef}
            mapContainerRef={mapContainerRef}
            selectedMarkerOcclusion={selectedMarkerOcclusion}
          />
          {mapMarkers.map((marker) => (
            <GoogleMapMarker
              key={marker.id}
              marker={marker}
              selected={marker.id === selectedMarkerId}
              onMarkerSelect={onMarkerSelect ? handleMarkerSelect : undefined}
            />
          ))}
          {children}
        </Map>
      ) : null}
    </div>
  );
}

function GoogleMapSelectedMarkerPan({
  marker,
  markerClickPanStateRef,
  mapContainerRef,
  selectedMarkerOcclusion,
}: {
  marker?: GoogleMapMarkerItem;
  markerClickPanStateRef: { current: MarkerClickPanState | null };
  mapContainerRef: { current: HTMLDivElement | null };
  selectedMarkerOcclusion?: GoogleMapSelectedMarkerOcclusion;
}) {
  const map = useMap();
  const markerId = marker?.id;
  const position = marker?.position;
  const lat = position?.lat;
  const lng = position?.lng;

  useEffect(() => {
    if (!map || !markerId || lat == null || lng == null) {
      return;
    }

    const markerClickPanState = markerClickPanStateRef.current;

    if (
      markerClickPanState?.markerId === markerId &&
      !isClickOccludedByPanel(markerClickPanState, mapContainerRef.current, selectedMarkerOcclusion)
    ) {
      markerClickPanStateRef.current = null;
      return;
    }

    markerClickPanStateRef.current = null;
    map.panTo(
      getOcclusionAdjustedCenter(map, { lat, lng }, selectedMarkerOcclusion) ?? {
        lat,
        lng,
      }
    );
  }, [lat, lng, map, mapContainerRef, markerClickPanStateRef, markerId, selectedMarkerOcclusion]);

  return null;
}

function getDomEvent(event: unknown) {
  if (!event || typeof event !== "object" || !("domEvent" in event)) {
    return undefined;
  }

  const domEvent = event.domEvent;

  return domEvent instanceof Event ? domEvent : undefined;
}

function getClientPoint(domEvent?: Event) {
  if (!domEvent) {
    return null;
  }

  if (
    "clientX" in domEvent &&
    typeof domEvent.clientX === "number" &&
    "clientY" in domEvent &&
    typeof domEvent.clientY === "number"
  ) {
    return {
      clientX: domEvent.clientX,
      clientY: domEvent.clientY,
    };
  }

  const maybeTouchEvent = domEvent as Event & { changedTouches?: TouchList };

  if (maybeTouchEvent.changedTouches && maybeTouchEvent.changedTouches.length > 0) {
    const touch = maybeTouchEvent.changedTouches[0];

    return {
      clientX: touch.clientX,
      clientY: touch.clientY,
    };
  }

  return null;
}

function isClickOccludedByPanel(
  markerClickPanState: MarkerClickPanState,
  mapContainer: HTMLDivElement | null,
  selectedMarkerOcclusion?: GoogleMapSelectedMarkerOcclusion
) {
  if (
    !selectedMarkerOcclusion ||
    !mapContainer ||
    markerClickPanState.clientX == null ||
    markerClickPanState.clientY == null
  ) {
    return false;
  }

  const rect = mapContainer.getBoundingClientRect();
  const x = markerClickPanState.clientX - rect.left;
  const y = markerClickPanState.clientY - rect.top;
  const topPx = selectedMarkerOcclusion.topPx ?? 0;
  const bottomPx = selectedMarkerOcclusion.bottomPx ?? 0;

  return x >= 0 && x <= selectedMarkerOcclusion.leftPx && y >= topPx && y <= rect.height - bottomPx;
}

function getOcclusionAdjustedCenter(
  map: GoogleMapInstance,
  markerPosition: GoogleMapPosition,
  selectedMarkerOcclusion?: GoogleMapSelectedMarkerOcclusion
) {
  if (!selectedMarkerOcclusion) {
    return null;
  }

  const projection = map.getProjection() as GoogleMapProjection | undefined;
  const zoom = map.getZoom();
  const mapsRuntime = getGoogleMapsRuntime();

  if (!projection || zoom == null || !mapsRuntime) {
    return null;
  }

  const markerPoint = projection.fromLatLngToPoint(
    new mapsRuntime.LatLng(markerPosition.lat, markerPosition.lng)
  );

  if (!markerPoint) {
    return null;
  }

  const scale = 2 ** zoom;
  const xOffsetPx = selectedMarkerOcclusion.leftPx / 2;
  const yOffsetPx =
    ((selectedMarkerOcclusion.topPx ?? 0) - (selectedMarkerOcclusion.bottomPx ?? 0)) / 2;
  const centerPoint = new mapsRuntime.Point(
    markerPoint.x - xOffsetPx / scale,
    markerPoint.y - yOffsetPx / scale
  );
  const center = projection.fromPointToLatLng(centerPoint);

  return center?.toJSON() ?? null;
}

function getGoogleMapsRuntime(): GoogleMapsRuntime | null {
  const maybeGoogle = (
    window as Window & {
      google?: {
        maps?: Partial<GoogleMapsRuntime>;
      };
    }
  ).google;
  const maps = maybeGoogle?.maps;

  if (!maps?.LatLng || !maps.Point) {
    return null;
  }

  return {
    LatLng: maps.LatLng,
    Point: maps.Point,
  };
}
