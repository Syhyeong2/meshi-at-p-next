import { cn } from "@/lib/utils";

type LegendItemProps = {
  color: string;
  label: string;
};

function LegendItem({ color, label }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full shadow-sm bg-${color}`} />
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </div>
  );
}

export type GoogleMapMarkerLegendProps = {
  className?: string;
};

export function GoogleMapMarkerLegend({ className }: GoogleMapMarkerLegendProps) {
  return (
    <div
      className={cn(
        "absolute top-4 right-4 flex flex-col gap-2 rounded-lg border border-gray-200 bg-white/90 p-3 shadow-lg backdrop-blur-sm",
        className
      )}
    >
      <LegendItem color="secondary" label="ごちめし対象店" />
      <LegendItem color="primary" label="その他のお店" />
    </div>
  );
}
