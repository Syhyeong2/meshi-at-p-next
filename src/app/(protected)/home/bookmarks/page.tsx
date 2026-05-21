import { getBookmarkedPlacesAction } from "@/features/places/actions";
import { PlaceList } from "@/features/places/components/PlaceList";
import { buildPanelHref, PLACE_DETAIL_PANEL } from "../places/_panel/panelLinks";
import { MapMarkersSync } from "@/components/google-maps";
import { toPlaceMarkers } from "@/features/places/placeMarkers";
import { PlacesPanelManager } from "../places/_panel/PlacesPanelManager";

type BookmarksPageProps = {
  searchParams: Promise<{
    panel?: string;
    placeId?: string;
    reviewId?: string;
  }>;
};

export default async function BookmarksPage({ searchParams }: BookmarksPageProps) {
  const { panel, placeId, reviewId } = await searchParams;
  const bookmarkedPlaces = await getBookmarkedPlacesAction();

  const buildDetailHref = (pid: string) =>
    buildPanelHref("", {
      basePath: "/home/bookmarks",
      panel: PLACE_DETAIL_PANEL,
      placeId: pid,
    });

  const placeDetailHrefs = Object.fromEntries(
    bookmarkedPlaces.map((place) => [place.id, buildDetailHref(place.id)])
  );

  const placeMarkers = toPlaceMarkers(bookmarkedPlaces).map((marker) => ({
    ...marker,
    href: placeDetailHrefs[marker.id],
  }));

  return (
    <>
      <MapMarkersSync source="bookmarks" markers={placeMarkers} selectedMarkerId={placeId} />

      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex flex-col gap-1 border-b border-b-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold text-slate-900">ブックマーク</h1>
          <span className="text-slate-500">{bookmarkedPlaces.length ?? 0}件のお店</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {bookmarkedPlaces.length > 0 ? (
            <PlaceList
              places={bookmarkedPlaces}
              placeDetailHrefs={placeDetailHrefs}
              activePlaceId={placeId}
            />
          ) : (
            <div className="flex h-full items-center justify-center py-20 text-sm text-slate-500">
              まだブックマークした店がありません
            </div>
          )}
        </div>
      </div>

      <PlacesPanelManager
        basePath="/home/bookmarks"
        panel={panel}
        placeId={placeId}
        reviewId={reviewId}
      />
    </>
  );
}
