"use client";

import { useUIStore } from "@/stores";
import { useEffect } from "react";
import { usePanelDrag } from "@/hooks/usePanelDrag";

export function HomeLayoutClient({
  children,
  map,
}: {
  children: React.ReactNode;
  map: React.ReactNode;
}) {
  const { isPanelOpen, isMobile, setIsMobile } = useUIStore();
  const { isDragging, getTranslateY, pointerHandlers, touchHandlers } = usePanelDrag({
    initialState: "half",
    thresholds: { large: 250, small: 50 },
    positions: { full: 0, half: 60, minimized: 94 },
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setIsMobile]);

  return (
    <div className="relative flex flex-1 overflow-hidden">
      <main className="relative z-10 flex h-full flex-1 flex-col overflow-hidden md:flex-row">
        <aside
          className={`absolute inset-x-0 bottom-0 z-20 flex h-full w-full flex-col bg-white md:relative md:inset-auto md:flex md:w-120 md:flex-none md:translate-y-0 ${
            isDragging ? "" : "transition-transform duration-500 ease-in-out"
          } rounded-t-3xl md:rounded-t-none ${isPanelOpen ? "hidden md:flex" : ""}`}
          style={{
            transform: getTranslateY(isMobile),
          }}
          {...(isMobile ? touchHandlers : {})}
        >
          <div
            className="flex h-10 shrink-0 cursor-pointer touch-none items-center justify-center md:hidden"
            {...pointerHandlers}
          >
            <div className="h-1.5 w-12 rounded-full bg-slate-300" />
          </div>

          <div className="flex-1 overflow-hidden">{children}</div>
        </aside>

        <section className="sticky inset-0 z-0 h-full w-full bg-slate-50 md:relative md:z-auto md:flex-1">
          <div className="h-full w-full">{map}</div>
        </section>
      </main>

      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
        <div id="map-overlay-root" className="relative h-full w-full"></div>
      </div>
    </div>
  );
}
