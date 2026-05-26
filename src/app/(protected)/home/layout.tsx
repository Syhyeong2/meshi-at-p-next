import React from "react";

import { StoreConnectedGoogleMap } from "@/components/google-maps";
import { getPublicGoogleMapsEnv } from "@/lib/google-maps/env";
import { NavigationSidebar } from "@/components/layout/NavigationBar";
import { HomeLayoutClient } from "@/components/layout/HomeLayoutClient";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { apiKey, mapId } = getPublicGoogleMapsEnv();

  const map = (
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
  );

  return (
    <div
      id="places_layout"
      className="bg-background flex h-screen w-full flex-col overflow-hidden md:flex-row"
    >
      {/* --- 1. メニューバー --- */}
      <div className="order-last md:order-first">
        <NavigationSidebar />
      </div>

      {/* --- 2. コンテンツエリアのコンテナ (Client Component) --- */}
      <HomeLayoutClient map={map}>{children}</HomeLayoutClient>
    </div>
  );
}
