import { create } from "zustand";

export type PanelState = "full" | "half" | "minimized";
export type MobileViewMode = "list" | "map";

interface UIStore {
  isListExpanded: boolean;
  setListExpanded: (expanded: boolean) => void;
  isPanelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isListExpanded: false,
  setListExpanded: (expanded) => set({ isListExpanded: expanded }),
  isPanelOpen: false,
  setPanelOpen: (open) => set({ isPanelOpen: open }),
  isMobile: false,
  setIsMobile: (isMobile) => set({ isMobile }),
}));
