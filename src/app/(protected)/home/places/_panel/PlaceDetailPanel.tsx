import { HomePanelFrame } from "../../_panel/HomePanelFrame";

type PlaceDetailPanelProps = {
  closeHref: string;
};

export function PlaceDetailPanel({ closeHref }: PlaceDetailPanelProps) {
  return (
    <HomePanelFrame title="お店詳細" closeHref={closeHref}>
      <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500">
        お店詳細パネル
      </div>
    </HomePanelFrame>
  );
}
