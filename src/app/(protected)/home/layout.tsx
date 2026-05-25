import React from "react";

import { StoreConnectedGoogleMap } from "@/components/google-maps";
import { getPublicGoogleMapsEnv } from "@/lib/google-maps/env";
import { NavigationSidebar } from "@/components/layout/NavigationBar";
import { GoogleMapMarkerLegend } from "@/components/google-maps/GoogleMapMarkerLegend";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { apiKey, mapId } = getPublicGoogleMapsEnv();

  return (
    <div id="places_layout" className="bg-background flex h-screen w-full overflow-hidden">
      {/* --- 1. 縦のメニューバー (x0) --- */}
      <NavigationSidebar />
      {/* --- コンテンツエリアのコンテナ --- */}
      <div className="relative flex flex-1 overflow-hidden">
        <main className="relative z-10 flex h-full flex-1 flex-row overflow-hidden">
          <aside className="flex h-full w-120 flex-col border-r border-slate-200 bg-white">
            {children}
          </aside>

          {/* マップ部分：残りの幅をすべて使い、一番背面に配置 */}
          <section className="h-full flex-1 bg-slate-50">
            <div className="h-full w-full">
              <StoreConnectedGoogleMap
                apiKey={apiKey}
                mapId={mapId}
                mapInstanceId="home-google-map"
                selectedMarkerOcclusion={{
                  leftPx: 504,
                  topPx: 48,
                  bottomPx: 48,
                }}
              />
              <GoogleMapMarkerLegend />
            </div>
          </section>
        </main>

        {/* --- マップの上にモーダル（オーバーレイ）をおける部分 --- */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div id="map-overlay-root" className="relative h-full w-full">
            {/* ポータルや状態管理でここへコンテンツを差し込む */}
          </div>
        </div>
      </div>
    </div>
  );
}
