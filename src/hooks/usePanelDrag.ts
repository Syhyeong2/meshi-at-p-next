import { useState, useRef, useCallback, useMemo, type PointerEvent, type TouchEvent } from "react";
import { type PanelState } from "@/stores/useUIStore";

export interface UsePanelDragOptions {
  initialState?: PanelState;
  state?: PanelState;
  onStateChange?: (state: PanelState) => void;
  thresholds?: {
    large: number;
    small: number;
  };
  positions?: {
    full: number;
    half: number;
    minimized: number;
  };
}

export function usePanelDrag({
  initialState = "half",
  state: externalState,
  onStateChange,
  thresholds = { large: 250, small: 50 },
  positions = { full: 0, half: 60, minimized: 94 },
}: UsePanelDragOptions = {}) {
  const [internalState, setInternalState] = useState<PanelState>(initialState);

  const panelState = externalState ?? internalState;

  const setPanelState = useCallback(
    (stateOrUpdater: PanelState | ((prev: PanelState) => PanelState)) => {
      if (onStateChange) {
        if (typeof stateOrUpdater === "function") {
          onStateChange(stateOrUpdater(panelState));
        } else {
          onStateChange(stateOrUpdater);
        }
      } else {
        setInternalState(stateOrUpdater);
      }
    },
    [onStateChange, panelState]
  );

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);

  const finalizeDrag = useCallback(
    (distance: number) => {
      setIsDragging(false);
      const { large, small } = thresholds;

      setPanelState((current) => {
        if (current === "full") {
          if (distance > large) return "minimized";
          if (distance > small) return "half";
        } else if (current === "half") {
          if (distance < -small) return "full";
          if (distance > small) return "minimized";
        } else if (current === "minimized") {
          if (distance < -large) return "full";
          if (distance < -small) return "half";
        }
        return current;
      });
      setDragY(0);
    },
    [thresholds, setPanelState]
  );

  const onPointerDown = useCallback((e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startY.current = e.clientY;
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;
      setDragY(e.clientY - startY.current);
    },
    [isDragging]
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      finalizeDrag(e.clientY - startY.current);
    },
    [isDragging, finalizeDrag]
  );

  const onTouchStart = useCallback((e: TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      const currentY = e.touches[0].clientY;
      setDragY(currentY - startY.current);
    },
    [isDragging]
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      const distance = e.changedTouches[0].clientY - startY.current;
      finalizeDrag(distance);
    },
    [isDragging, finalizeDrag]
  );

  const getTranslateY = useCallback(
    (isMobile: boolean) => {
      if (!isMobile) return undefined;
      const base = positions[panelState];
      const value = isDragging ? `calc(${base}% + ${dragY}px)` : `${base}%`;
      return `translateY(${value})`;
    },
    [positions, panelState, isDragging, dragY]
  );

  const pointerHandlers = useMemo(
    () => ({
      onPointerDown,
      onPointerMove,
      onPointerUp,
    }),
    [onPointerDown, onPointerMove, onPointerUp]
  );

  const touchHandlers = useMemo(
    () => ({
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    }),
    [onTouchStart, onTouchMove, onTouchEnd]
  );

  return {
    panelState,
    setPanelState,
    dragY,
    isDragging,
    getTranslateY,
    pointerHandlers,
    touchHandlers,
  };
}
