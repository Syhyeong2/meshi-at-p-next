import type {
  GoogleMapMarkerItem,
  GoogleMapMarkerVariant,
  GoogleMapOptions,
  GoogleMapPosition,
} from "./types";

export const DEFAULT_GOOGLE_MAP_CENTER: GoogleMapPosition = {
  lat: 35.6563924,
  lng: 139.6965651,
};

export const DEFAULT_GOOGLE_MAP_ZOOM = 15.5;

export const DEFAULT_GOOGLE_MAP_OPTIONS: GoogleMapOptions = {
  clickableIcons: false,
  fullscreenControl: false,
  gestureHandling: "greedy",
  mapTypeControl: false,
  streetViewControl: false,
};

export const DEFAULT_CENTER_MARKER_VARIANT: GoogleMapMarkerVariant = "default-center";
export const GOCHIMESHI_MARKER_VARIANT: GoogleMapMarkerVariant = "gochimeshi";
export const NON_GOCHIMESHI_MARKER_VARIANT: GoogleMapMarkerVariant = "non-gochimeshi";

export const DEFAULT_GOOGLE_MAP_CENTER_MARKER: GoogleMapMarkerItem = {
  id: "default-google-map-center",
  position: DEFAULT_GOOGLE_MAP_CENTER,
  title: "Default map center",
  variant: DEFAULT_CENTER_MARKER_VARIANT,
  clickable: false,
  zIndex: 0,
};

export const GOCHIMESHI_MARKER_Z_INDEX = 10;
export const NON_GOCHIMESHI_MARKER_Z_INDEX = 1;

export const PRICE_LEVELS = [
  { value: 1, label: "〜¥1,000" },
  { value: 2, label: "¥1,000〜¥3,000" },
  { value: 3, label: "¥3,000〜¥5,000" },
  { value: 4, label: "¥5,000〜¥10,000" },
  { value: 5, label: "¥10,000〜" },
];
