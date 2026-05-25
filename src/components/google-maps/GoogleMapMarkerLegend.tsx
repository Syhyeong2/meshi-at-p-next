export function GoogleMapMarkerLegend() {
  return (
    <div className="absolute top-4 right-4 z-1 flex flex-col gap-2 rounded-lg border border-gray-200 bg-white/90 p-3 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="bg-secondary h-3 w-3 rounded-full shadow-sm" />
        <span className="text-xs font-medium text-gray-600">ごちめし対象店</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-primary h-3 w-3 rounded-full shadow-sm" />
        <span className="text-xs font-medium text-gray-600">その他のお店</span>
      </div>
    </div>
  );
}
