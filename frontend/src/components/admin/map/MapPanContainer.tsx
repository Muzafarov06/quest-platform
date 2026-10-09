import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';

export interface MapPanContainerHandle {
  focusOn(px: number, py: number, z: number): void;
  resetZoom(): void;
  setZoom(z: number): void;
}

interface Props {
  width: number;
  height: number;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  zoom: number;
  onZoomChange: (z: number) => void;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  minZoom?: number;
  fitMinZoomToViewport?: boolean;
  fitMinZoomMode?: 'cover' | 'contain';
}

const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.15;

export const MapPanContainer = forwardRef<MapPanContainerHandle, Props>(
  function MapPanContainer(
    {
      width,
      height,
      children,
      className = '',
      disabled = false,
      zoom,
      onZoomChange,
      contentRef,
      minZoom = 0.3,
      fitMinZoomToViewport = false,
      fitMinZoomMode = 'cover',
    },
    ref
  ) {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const innerRef = useRef<HTMLDivElement | null>(null);

    const [isPanning, setIsPanning] = useState(false);
    const [effectiveMinZoom, setEffectiveMinZoom] = useState(minZoom);

    const offsetRef = useRef({ x: 0, y: 0 });
    const initialCentered = useRef(false);
    const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
    const zoomRef = useRef(zoom);
    const isPanningRef = useRef(false);
    const fitAppliedRef = useRef(false);

    useEffect(() => {
      zoomRef.current = zoom;
    }, [zoom]);

    useEffect(() => {
      isPanningRef.current = isPanning;
    }, [isPanning]);

    useEffect(() => {
      if (contentRef) contentRef.current = innerRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contentRef]);

    const applyTransform = useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      const o = offsetRef.current;
      const z = zoomRef.current;
      el.style.transform = `translate(${o.x}px, ${o.y}px) scale(${z})`;
    }, []);

    /* Clamp строго по границам полотна. Если полотно меньше вьюпорта —
       центрируем. Иначе — не выходим за края. */
    const clampOffset = useCallback(
      (ox: number, oy: number, z: number) => {
        const el = viewportRef.current;
        if (!el) return { x: ox, y: oy };
        const vw = el.clientWidth;
        const vh = el.clientHeight;
        const cw = width * z;
        const ch = height * z;

        let x: number;
        let y: number;

        if (cw <= vw) x = (vw - cw) / 2;
        else x = Math.max(vw - cw, Math.min(0, ox));

        if (ch <= vh) y = (vh - ch) / 2;
        else y = Math.max(vh - ch, Math.min(0, oy));

        return { x, y };
      },
      [width, height]
    );

    useEffect(() => {
      if (!fitMinZoomToViewport) {
        setEffectiveMinZoom(minZoom);
        return;
      }
      const el = viewportRef.current;
      if (!el) return;
      const update = () => {
        const vw = el.clientWidth;
        const vh = el.clientHeight;
        if (vw === 0 || vh === 0 || width === 0 || height === 0) return;
        const fx = vw / width;
        const fy = vh / height;
        const fit =
          fitMinZoomMode === 'contain'
            ? Math.min(fx, fy)
            : Math.max(fx, fy);
        setEffectiveMinZoom(Math.max(minZoom, fit));
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }, [fitMinZoomToViewport, fitMinZoomMode, minZoom, width, height]);

    useEffect(() => {
      if (effectiveMinZoom <= 0) return;

      if (zoom < effectiveMinZoom - 0.0001) {
        onZoomChange(effectiveMinZoom);
        return;
      }

      if (fitMinZoomToViewport && !fitAppliedRef.current) {
        fitAppliedRef.current = true;
        if (Math.abs(zoom - effectiveMinZoom) > 0.001) {
          onZoomChange(effectiveMinZoom);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveMinZoom, zoom, fitMinZoomToViewport]);

    useEffect(() => {
      if (initialCentered.current) return;
      const el = viewportRef.current;
      if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;
      initialCentered.current = true;

      const z = fitMinZoomToViewport
        ? Math.max(minZoom, effectiveMinZoom)
        : Math.max(zoom, effectiveMinZoom);

      offsetRef.current = clampOffset(
        el.clientWidth / 2 - (width * z) / 2,
        el.clientHeight / 2 - (height * z) / 2,
        z
      );
      applyTransform();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      width,
      height,
      zoom,
      effectiveMinZoom,
      clampOffset,
      fitMinZoomToViewport,
      minZoom,
    ]);

    useEffect(() => {
      const el = viewportRef.current;
      if (!el) return;
      offsetRef.current = clampOffset(
        offsetRef.current.x,
        offsetRef.current.y,
        zoom
      );
      applyTransform();
    }, [zoom, clampOffset, applyTransform]);

    useImperativeHandle(
      ref,
      () => ({
        focusOn(px: number, py: number, z: number) {
          const el = viewportRef.current;
          if (!el) return;
          const vw = el.clientWidth;
          const vh = el.clientHeight;
          const clamped = Math.max(effectiveMinZoom, Math.min(MAX_ZOOM, z));
          const ox = vw / 2 - px * clamped;
          const oy = vh / 2 - py * clamped;
          zoomRef.current = clamped;
          offsetRef.current = clampOffset(ox, oy, clamped);
          applyTransform();
          onZoomChange(clamped);
        },
        resetZoom() {
          const el = viewportRef.current;
          if (!el) return;
          const z = fitMinZoomToViewport
            ? Math.max(minZoom, effectiveMinZoom)
            : Math.max(1, effectiveMinZoom);
          zoomRef.current = z;
          offsetRef.current = clampOffset(
            el.clientWidth / 2 - (width * z) / 2,
            el.clientHeight / 2 - (height * z) / 2,
            z
          );
          applyTransform();
          onZoomChange(z);
        },
        setZoom(z: number) {
          const el = viewportRef.current;
          if (!el) return;
          const clamped = Math.max(
            effectiveMinZoom,
            Math.min(MAX_ZOOM, z)
          );
          const vw = el.clientWidth;
          const vh = el.clientHeight;
          const cx = (vw / 2 - offsetRef.current.x) / zoomRef.current;
          const cy = (vh / 2 - offsetRef.current.y) / zoomRef.current;
          const ox = vw / 2 - cx * clamped;
          const oy = vh / 2 - cy * clamped;
          zoomRef.current = clamped;
          offsetRef.current = clampOffset(ox, oy, clamped);
          applyTransform();
          onZoomChange(clamped);
        },
      }),
      [clampOffset, applyTransform, onZoomChange, effectiveMinZoom, width, height]
    );

    useEffect(() => {
      const el = viewportRef.current;
      if (!el) return;
      const ro = new ResizeObserver(() => {
        offsetRef.current = clampOffset(
          offsetRef.current.x,
          offsetRef.current.y,
          zoomRef.current
        );
        applyTransform();
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, [clampOffset, applyTransform]);

    const getLocalXY = useCallback((clientX: number, clientY: number) => {
      const el = viewportRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    }, []);

    const zoomAt = useCallback(
      (clientX: number, clientY: number, nextZoom: number) => {
        const z = zoomRef.current;
        const clamped = Math.max(
          effectiveMinZoom,
          Math.min(MAX_ZOOM, nextZoom)
        );
        if (Math.abs(clamped - z) < 0.001) return;
        const local = getLocalXY(clientX, clientY);
        const cx = (local.x - offsetRef.current.x) / z;
        const cy = (local.y - offsetRef.current.y) / z;
        const nx = local.x - cx * clamped;
        const ny = local.y - cy * clamped;
        zoomRef.current = clamped;
        offsetRef.current = clampOffset(nx, ny, clamped);
        applyTransform();
        onZoomChange(clamped);
      },
      [getLocalXY, onZoomChange, clampOffset, effectiveMinZoom, applyTransform]
    );

    const zoomCenter = useCallback(
      (delta: number) => {
        const el = viewportRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        zoomAt(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          zoomRef.current + delta
        );
      },
      [zoomAt]
    );

    const startPan = useCallback(
      (clientX: number, clientY: number, target: HTMLElement) => {
        if (disabled) return;
        if (target.closest('[data-no-pan="true"]')) return;
        setIsPanning(true);
        panStart.current = {
          x: clientX,
          y: clientY,
          ox: offsetRef.current.x,
          oy: offsetRef.current.y,
        };
      },
      [disabled]
    );

    const movePan = useCallback(
      (clientX: number, clientY: number) => {
        if (!isPanningRef.current) return;
        const raw = {
          x: panStart.current.ox + (clientX - panStart.current.x),
          y: panStart.current.oy + (clientY - panStart.current.y),
        };
        offsetRef.current = clampOffset(raw.x, raw.y, zoomRef.current);
        applyTransform();
      },
      [clampOffset, applyTransform]
    );

    const endPan = useCallback(() => setIsPanning(false), []);

    useEffect(() => {
      const el = viewportRef.current;
      if (!el) return;
      const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        startPan(e.clientX, e.clientY, e.target as HTMLElement);
      };
      const onMouseMove = (e: MouseEvent) => movePan(e.clientX, e.clientY);
      const onMouseUp = () => endPan();
      el.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        el.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }, [startPan, movePan, endPan]);

    useEffect(() => {
      const el = viewportRef.current;
      if (!el) return;
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const dir = e.deltaY < 0 ? 1 : -1;
        zoomAt(e.clientX, e.clientY, zoomRef.current + dir * ZOOM_STEP);
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    }, [zoomAt]);

    useEffect(() => {
      const el = viewportRef.current;
      if (!el) return;

      let mode: 'none' | 'pan' | 'pinch' = 'none';
      let panTouchId: number | null = null;
      let pinchStart: {
        d: number;
        zoom: number;
        cx: number;
        cy: number;
      } | null = null;

      const dist = (a: Touch, b: Touch) =>
        Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const mid = (a: Touch, b: Touch) => ({
        x: (a.clientX + b.clientX) / 2,
        y: (a.clientY + b.clientY) / 2,
      });

      const onTouchStart = (e: TouchEvent) => {
        if (disabled) return;
        if (e.touches.length === 2) {
          mode = 'pinch';
          const a = e.touches[0];
          const b = e.touches[1];
          const m = mid(a, b);
          const local = getLocalXY(m.x, m.y);
          pinchStart = {
            d: dist(a, b),
            zoom: zoomRef.current,
            cx: (local.x - offsetRef.current.x) / zoomRef.current,
            cy: (local.y - offsetRef.current.y) / zoomRef.current,
          };
          return;
        }
        if (e.touches.length === 1) {
          const t = e.touches[0];
          if ((e.target as HTMLElement).closest('[data-no-pan="true"]')) return;
          mode = 'pan';
          panTouchId = t.identifier;
          startPan(t.clientX, t.clientY, e.target as HTMLElement);
        }
      };

      const onTouchMove = (e: TouchEvent) => {
        if (mode === 'pinch' && e.touches.length === 2 && pinchStart) {
          e.preventDefault();
          const a = e.touches[0];
          const b = e.touches[1];
          const nd = dist(a, b);
          const nextZoom = Math.max(
            effectiveMinZoom,
            Math.min(MAX_ZOOM, pinchStart.zoom * (nd / pinchStart.d))
          );
          const m = mid(a, b);
          const local = getLocalXY(m.x, m.y);
          const nx = local.x - pinchStart.cx * nextZoom;
          const ny = local.y - pinchStart.cy * nextZoom;
          zoomRef.current = nextZoom;
          offsetRef.current = clampOffset(nx, ny, nextZoom);
          applyTransform();
          onZoomChange(nextZoom);
          return;
        }
        if (mode === 'pan' && panTouchId !== null) {
          const t = Array.from(e.touches).find(
            (x) => x.identifier === panTouchId
          );
          if (!t) return;
          e.preventDefault();
          movePan(t.clientX, t.clientY);
        }
      };

      const onTouchEnd = () => {
        mode = 'none';
        panTouchId = null;
        pinchStart = null;
        endPan();
      };

      el.addEventListener('touchstart', onTouchStart, { passive: true });
      el.addEventListener('touchmove', onTouchMove, { passive: false });
      el.addEventListener('touchend', onTouchEnd);
      el.addEventListener('touchcancel', onTouchEnd);
      return () => {
        el.removeEventListener('touchstart', onTouchStart);
        el.removeEventListener('touchmove', onTouchMove);
        el.removeEventListener('touchend', onTouchEnd);
        el.removeEventListener('touchcancel', onTouchEnd);
      };
    }, [
      disabled,
      startPan,
      movePan,
      endPan,
      onZoomChange,
      getLocalXY,
      clampOffset,
      effectiveMinZoom,
      applyTransform,
    ]);

    const resetView = () => {
      const el = viewportRef.current;
      if (!el) return;
      const z = fitMinZoomToViewport
        ? Math.max(minZoom, effectiveMinZoom)
        : Math.max(1, effectiveMinZoom);
      offsetRef.current = clampOffset(
        el.clientWidth / 2 - (width * z) / 2,
        el.clientHeight / 2 - (height * z) / 2,
        z
      );
      zoomRef.current = z;
      applyTransform();
      onZoomChange(z);
    };

    return (
      <div
        className={
          'relative overflow-hidden select-none ' +
          (isPanning ? 'cursor-grabbing' : 'cursor-grab') +
          ' ' +
          className
        }
        style={{ touchAction: 'none' }}
      >
        <div ref={viewportRef} className="absolute inset-0">
          <div
            ref={innerRef}
            style={{
              position: 'relative',
              transform: `translate(${offsetRef.current.x}px, ${offsetRef.current.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width,
              height,
              willChange: 'transform',
            }}
          >
            {children}
          </div>
        </div>

        <div
          className="absolute bottom-3 right-3 z-[100] flex flex-col items-stretch gap-1"
          data-no-pan="true"
        >
          <button
            type="button"
            onClick={() => zoomCenter(ZOOM_STEP)}
            disabled={disabled || zoom >= MAX_ZOOM}
            title="Приблизить"
            className="w-10 h-10 flex items-center justify-center
                       bg-ink/90 border border-brass/50 text-brass
                       font-poster text-xl leading-none
                       hover:bg-brass/20 transition-colors cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }}
          >
            +
          </button>
          <div
            className="type text-[10px] uppercase tracking-[0.2em]
                       bg-ink/90 border border-brass/40 text-bone-muted
                       px-2 py-1.5 text-center tabular-nums"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }}
          >
            {Math.round(zoom * 100)}%
          </div>
          <button
            type="button"
            onClick={() => zoomCenter(-ZOOM_STEP)}
            disabled={disabled || zoom <= effectiveMinZoom + 0.0001}
            title="Отдалить"
            className="w-10 h-10 flex items-center justify-center
                       bg-ink/90 border border-brass/50 text-brass
                       font-poster text-xl leading-none
                       hover:bg-brass/20 transition-colors cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }}
          >
            −
          </button>
          <button
            type="button"
            onClick={resetView}
            disabled={disabled}
            title="Сбросить вид"
            className="w-10 h-10 flex items-center justify-center
                       bg-ink/90 border border-brass/50 text-brass
                       type text-[14px] leading-none
                       hover:bg-brass/20 transition-colors cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }}
          >
            ⌂
          </button>
        </div>
      </div>
    );
  }
);