import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { useImageSize, type ImageSize } from '../../../hooks/useImageSize';
import type { Location } from '../../../types/location';
import {
  clamp,
  collectInitialCollisions,
  collidesWithAny,
  normalizeRotation,
  type IdentifiedBounds,
} from '../../../utils/collision';

/** Базовая ширина карточки (px). Высота подстраивается под картинку. */
export const NODE_WIDTH = 200;

/** Высота-фолбэк, если картинки нет. */
export const NODE_HEIGHT = 100;

/** Ограничения высоты, чтобы экстремальные пропорции не ломали карту. */
export const NODE_MIN_HEIGHT = 60;
export const NODE_MAX_HEIGHT = 320;

/** Насколько карточка увеличивается при наведении. */
const HOVER_SCALE = 1.03;

/**
 * Размер карточки с учётом пропорций PNG.
 *
 * Ширина — всегда NODE_WIDTH.
 * Высота — пропорциональна натуральным размерам картинки, но
 * зажата в [NODE_MIN_HEIGHT, NODE_MAX_HEIGHT], чтобы совсем узкие
 * или очень вытянутые картинки не разносили полотно.
 *
 * Если картинки нет — возвращаем дефолт NODE_WIDTH × NODE_HEIGHT.
 */
export function computeNodeSize(natural: ImageSize | null): { w: number; h: number } {
  if (!natural || natural.width <= 0 || natural.height <= 0) {
    return { w: NODE_WIDTH, h: NODE_HEIGHT };
  }
  const aspect = natural.width / natural.height;
  const w = NODE_WIDTH;
  let h = w / aspect;
  if (h < NODE_MIN_HEIGHT) h = NODE_MIN_HEIGHT;
  if (h > NODE_MAX_HEIGHT) h = NODE_MAX_HEIGHT;
  return { w, h: Math.round(h) };
}

export interface MapTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface MapBounds {
  width: number;
  height: number;
}

type DragMode = 'idle' | 'move' | 'resize' | 'rotate';

interface Props {
  location: Location;
  selected: boolean;
  hovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onTransformEnd: (id: string, patch: MapTransform) => void;
  obstacles?: IdentifiedBounds[];
  zoom?: number;
  pickTarget?: boolean;
  linkSource?: boolean;
  bounds?: MapBounds;
  /** Сообщаем наружу актуальный размер карточки — для obstacles и bounds. */
  onSizeResolved?: (id: string, size: { w: number; h: number }) => void;
}

export function LocationNode({
  location,
  selected,
  hovered,
  onSelect,
  onHover,
  onTransformEnd,
  obstacles = [],
  zoom = 1,
  pickTarget = false,
  linkSource = false,
  bounds,
  onSizeResolved,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const coverUrl = useMediaUrl(location.mapMediaId);
  const naturalSize = useImageSize(coverUrl);
  const { w: baseW, h: baseH } = computeNodeSize(naturalSize);

  useEffect(() => {
    onSizeResolved?.(location.id, { w: baseW, h: baseH });
  }, [location.id, baseW, baseH, onSizeResolved]);

  const [pos, setPos] = useState({ x: location.mapX, y: location.mapY });
  const [scale, setScale] = useState(location.sceneScale ?? 1);
  const [rotation, setRotation] = useState(location.sceneRotation ?? 0);
  const [dragging, setDragging] = useState(false);

  const posRef = useRef(pos);
  const scaleRef = useRef(scale);
  const rotationRef = useRef(rotation);
  const dragModeRef = useRef<DragMode>('idle');
  const movedRef = useRef(false);
  const initialCollisionsRef = useRef<Set<string>>(new Set());

  const obstaclesRef = useRef(obstacles);
  const onTransformEndRef = useRef(onTransformEnd);
  const onSelectRef = useRef(onSelect);
  const pickTargetRef = useRef(pickTarget);
  const zoomRef = useRef(zoom);
  const boundsRef = useRef(bounds);
  const baseSizeRef = useRef({ w: baseW, h: baseH });

  useEffect(() => {
    obstaclesRef.current = obstacles;
    onTransformEndRef.current = onTransformEnd;
    onSelectRef.current = onSelect;
    pickTargetRef.current = pickTarget;
    zoomRef.current = zoom;
    boundsRef.current = bounds;
    baseSizeRef.current = { w: baseW, h: baseH };
  }, [obstacles, onTransformEnd, onSelect, pickTarget, zoom, bounds, baseW, baseH]);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    if (dragModeRef.current !== 'idle') return;
    setPos({ x: location.mapX, y: location.mapY });
    setScale(location.sceneScale ?? 1);
    setRotation(location.sceneRotation ?? 0);
  }, [
    location.mapX,
    location.mapY,
    location.sceneScale,
    location.sceneRotation,
  ]);

  const dragInfo = useRef({
    mouseX: 0,
    mouseY: 0,
    posX: 0,
    posY: 0,
    scale: 1,
    rotation: 0,
    centerX: 0,
    centerY: 0,
    startDist: 1,
    startAngle: 0,
  });

  const clampToBounds = useCallback(
    (x: number, y: number, sc: number): { x: number; y: number } => {
      const b = boundsRef.current;
      if (!b) return { x, y };
      const { w: bw, h: bh } = baseSizeRef.current;
      const w = bw * sc;
      const h = bh * sc;
      const maxX = Math.max(0, b.width - w);
      const maxY = Math.max(0, b.height - h);
      return {
        x: clamp(x, 0, maxX),
        y: clamp(y, 0, maxY),
      };
    },
    []
  );

  const selfBounds = (
    p: { x: number; y: number },
    sc: number
  ): IdentifiedBounds => {
    const { w: bw, h: bh } = baseSizeRef.current;
    return {
      id: location.id,
      x: p.x + bw / 2,
      y: p.y + bh / 2,
      halfW: (bw * sc) / 2,
      halfH: (bh * sc) / 2,
    };
  };

  const startDrag = useCallback(
    (mode: DragMode) => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (pickTargetRef.current) {
        onSelectRef.current(location.id);
        return;
      }

      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dist = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
      const angle =
        (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;

      const startPos = posRef.current;
      const startScale = scaleRef.current;

      initialCollisionsRef.current = collectInitialCollisions(
        selfBounds(startPos, startScale),
        obstaclesRef.current,
        location.id
      );

      movedRef.current = false;
      dragInfo.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        posX: startPos.x,
        posY: startPos.y,
        scale: startScale,
        rotation: rotationRef.current,
        centerX: cx,
        centerY: cy,
        startDist: dist,
        startAngle: angle,
      };
      dragModeRef.current = mode;
      setDragging(true);
    },
    [location.id]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const mode = dragModeRef.current;
      if (mode === 'idle') return;

      const s = dragInfo.current;
      if (
        Math.abs(e.clientX - s.mouseX) > 3 ||
        Math.abs(e.clientY - s.mouseY) > 3
      ) {
        movedRef.current = true;
      }

      const { w: bw, h: bh } = baseSizeRef.current;

      if (mode === 'move') {
        const z = zoomRef.current || 1;
        const dx = (e.clientX - s.mouseX) / z;
        const dy = (e.clientY - s.mouseY) / z;

        const curScale = scaleRef.current;
        const curHw = (bw * curScale) / 2;
        const curHh = (bh * curScale) / 2;
        const ignore = initialCollisionsRef.current;

        let nx = s.posX;
        let ny = s.posY;

        const tryX = s.posX + dx;
        const boundsX = {
          id: location.id,
          x: tryX + bw / 2,
          y: s.posY + bh / 2,
          halfW: curHw,
          halfH: curHh,
        };
        if (
          !collidesWithAny(boundsX, obstaclesRef.current, location.id, ignore)
        ) {
          nx = tryX;
        }

        const tryY = s.posY + dy;
        const boundsY = {
          id: location.id,
          x: nx + bw / 2,
          y: tryY + bh / 2,
          halfW: curHw,
          halfH: curHh,
        };
        if (
          !collidesWithAny(boundsY, obstaclesRef.current, location.id, ignore)
        ) {
          ny = tryY;
        }

        const clamped = clampToBounds(nx, ny, curScale);
        setPos({ x: clamped.x, y: clamped.y });
        return;
      }

      if (mode === 'resize') {
        const dist = Math.hypot(e.clientX - s.centerX, e.clientY - s.centerY);
        let next = clamp(s.scale * (dist / s.startDist), 0.1, 10);

        const b = boundsRef.current;
        if (b) {
          const maxByW = b.width / bw;
          const maxByH = b.height / bh;
          next = Math.min(next, maxByW, maxByH);
          next = Math.max(next, 0.1);
        }

        const cx = s.posX + bw / 2;
        const cy = s.posY + bh / 2;
        const tryBounds = {
          id: location.id,
          x: cx,
          y: cy,
          halfW: (bw * next) / 2,
          halfH: (bh * next) / 2,
        };
        if (
          !collidesWithAny(
            tryBounds,
            obstaclesRef.current,
            location.id,
            initialCollisionsRef.current
          )
        ) {
          setScale(next);
        }
        return;
      }

      if (mode === 'rotate') {
        const angle =
          (Math.atan2(e.clientY - s.centerY, e.clientX - s.centerX) * 180) /
          Math.PI;
        setRotation(normalizeRotation(s.rotation + (angle - s.startAngle)));
      }
    };

    const onUp = () => {
      const mode = dragModeRef.current;
      if (mode === 'idle') return;

      dragModeRef.current = 'idle';
      setDragging(false);

      if (movedRef.current) {
        const s = dragInfo.current;
        const cur = {
          pos: posRef.current,
          scale: scaleRef.current,
          rotation: rotationRef.current,
        };
        const changed =
          cur.pos.x !== s.posX ||
          cur.pos.y !== s.posY ||
          cur.scale !== s.scale ||
          cur.rotation !== s.rotation;
        if (changed) {
          onTransformEndRef.current(location.id, {
            x: cur.pos.x,
            y: cur.pos.y,
            scale: cur.scale,
            rotation: cur.rotation,
          });
        } else {
          onSelectRef.current(location.id);
        }
      } else if (mode === 'move') {
        onSelectRef.current(location.id);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [location.id, clampToBounds]);

  const isActive = selected || hovered || pickTarget || linkSource;

  const w = baseW * scale;
  const h = baseH * scale;

  const baseZ = Math.round(pos.y);
  const zIndex = selected ? baseZ + 10000 : hovered ? baseZ + 5000 : baseZ;

  const hoverScale = hovered && !dragging ? HOVER_SCALE : 1;

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      data-no-pan="true"
      onMouseDown={startDrag('move')}
      onMouseEnter={() => onHover(location.id)}
      onMouseLeave={() => onHover(null)}
      className={
        'absolute select-none ' +
        (pickTarget
          ? 'cursor-crosshair '
          : dragging
          ? 'cursor-grabbing '
          : 'cursor-grab ')
      }
      style={{
        left: pos.x + baseW / 2,
        top: pos.y + baseH / 2,
        width: w,
        height: h,
        zIndex,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${hoverScale})`,
        transformOrigin: 'center',
        transition: dragging
          ? 'none'
          : 'transform 160ms ease, width 100ms ease, height 100ms ease',
      }}
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={location.name}
          draggable={false}
          className="w-full h-full object-contain pointer-events-none select-none"
        />
      ) : (
        <div
          className={
            'w-full h-full flex items-center justify-center border-2 border-dashed ' +
            (selected || pickTarget || linkSource
              ? 'border-blood bg-blood/10'
              : hovered
              ? 'border-brass bg-brass/5'
              : 'border-bone/30 bg-ink/40')
          }
        >
          <span className="type text-[10px] uppercase tracking-[0.2em] text-bone-muted px-2 text-center">
            {location.name}
          </span>
        </div>
      )}

      {linkSource && (
        <span
          className="absolute -top-3 -left-3 w-7 h-7 rounded-full
                     bg-blood text-paper flex items-center justify-center
                     type text-[11px] font-bold border-2 border-paper pointer-events-none"
          style={{
            transform: `rotate(${-rotation}deg)`,
          }}
        >
          A
        </span>
      )}

      {pickTarget && (
        <span
          className="absolute -top-3 -right-3 px-2 py-0.5
                     bg-green-700 text-paper border border-paper
                     type text-[9px] uppercase tracking-[0.2em] pointer-events-none"
          style={{
            transform: `rotate(${-rotation}deg)`,
          }}
        >
          выбрать
        </span>
      )}

      {isActive && (
        <div
          className="absolute left-1/2 pointer-events-none"
          style={{
            top: '100%',
            transform: `translate(-50%, 4px) rotate(${-rotation}deg)`,
            transformOrigin: 'top center',
          }}
        >
          <span
            className="type text-[10px] uppercase tracking-[0.22em]
                       bg-ink/95 border border-brass/50 text-bone
                       px-2.5 py-1 whitespace-nowrap inline-block"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            {location.name}
          </span>
        </div>
      )}

      {location.discoveryMode !== 'ALWAYS' && isActive && !pickTarget && (
        <span
          className="absolute top-0 left-0 px-1.5 py-0.5
                     bg-blood/90 text-paper border border-paper
                     type text-[9px] uppercase tracking-[0.2em] pointer-events-none"
          style={{ transform: `rotate(${-rotation}deg)` }}
        >
          🔒
        </span>
      )}

      {selected && !pickTarget && (
        <>
          {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
            <div
              key={k}
              data-no-pan="true"
              onMouseDown={startDrag('resize')}
              className="absolute"
              style={{
                width: 14,
                height: 14,
                background: '#ece2c9',
                border: '2px solid #9c1c1c',
                borderRadius: 2,
                cursor:
                  k === 'tl' || k === 'br' ? 'nwse-resize' : 'nesw-resize',
                top: k === 'tl' || k === 'tr' ? -7 : 'auto',
                bottom: k === 'bl' || k === 'br' ? -7 : 'auto',
                left: k === 'tl' || k === 'bl' ? -7 : 'auto',
                right: k === 'tr' || k === 'br' ? -7 : 'auto',
              }}
            />
          ))}
          <div
            className="absolute left-1/2 pointer-events-none"
            style={{
              top: -26,
              width: 2,
              height: 18,
              background: '#9c1c1c',
              transform: 'translateX(-50%)',
            }}
          />
          <div
            data-no-pan="true"
            onMouseDown={startDrag('rotate')}
            title="Повернуть"
            className="absolute left-1/2 flex items-center justify-center"
            style={{
              top: -44,
              width: 22,
              height: 22,
              background: '#ece2c9',
              border: '2px solid #9c1c1c',
              borderRadius: '50%',
              transform: 'translateX(-50%)',
              cursor: 'grab',
              fontSize: 11,
              color: '#9c1c1c',
              lineHeight: 1,
            }}
          >
            ↻
          </div>
        </>
      )}
    </div>
  );
}