"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useSyncExternalStore, type ReactNode, useEffect } from "react";
import { useUIStore } from "@/stores";
import { usePanelDrag } from "@/hooks/usePanelDrag";

type HomePanelFrameProps = {
  title: string;
  closeHref: string;
  children: ReactNode;
};

const MAP_OVERLAY_ROOT_ID = "map-overlay-root";

function getPortalRootSnapshot() {
  return document.getElementById(MAP_OVERLAY_ROOT_ID);
}

function getServerPortalRootSnapshot() {
  return null;
}

function subscribeToPortalRoot(onStoreChange: () => void) {
  const animationFrameId = window.requestAnimationFrame(onStoreChange);
  const observer = new MutationObserver(onStoreChange);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return () => {
    window.cancelAnimationFrame(animationFrameId);
    observer.disconnect();
  };
}

export function HomePanelFrame({ title, closeHref, children }: HomePanelFrameProps) {
  const portalRoot = useSyncExternalStore(
    subscribeToPortalRoot,
    getPortalRootSnapshot,
    getServerPortalRootSnapshot
  );

  const { setPanelOpen, isMobile } = useUIStore();
  const { isDragging, getTranslateY, pointerHandlers, touchHandlers } = usePanelDrag({
    initialState: "half",
    thresholds: { large: 250, small: 50 },
    positions: { full: 0, half: 60, minimized: 94 },
  });

  useEffect(() => {
    setPanelOpen(true);
    return () => {
      setPanelOpen(false);
    };
  }, [setPanelOpen]);

  if (!portalRoot) return null;

  return createPortal(
    <section
      aria-label={title}
      className={`pointer-events-auto absolute inset-0 z-30 flex flex-col overflow-hidden bg-white md:top-12 md:bottom-12 md:left-120 md:ml-6 md:w-120 md:rounded-lg md:border md:border-slate-200 md:shadow-2xl ${
        isDragging ? "" : "transition-transform duration-300 ease-out"
      } rounded-t-3xl md:rounded-t-lg`}
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

      <header className="flex h-14 flex-none items-center justify-between border-b border-slate-200 px-4">
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
        <Link
          href={closeHref}
          replace
          scroll={false}
          aria-label="Close panel"
          className="mr-[-5.5px] inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
        >
          <X className="size-5" aria-hidden="true" />
        </Link>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>,
    portalRoot
  );
}
