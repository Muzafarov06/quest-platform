import { useEffect, useRef, useState } from 'react';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { useImageSize, type ImageSize } from '../../../hooks/useImageSize';
import {
  clamp,
  collectInitialCollisions,
  collidesWithAny,
  normalizeRotation,
  type IdentifiedBounds,
} from '../../../utils/collision';
import {
  computePinZ,
  resolvePinLayer,
  Z_OFFSET_HOVERED,
  Z_OFFSET_SELECTED,
} from '../../../utils/sceneLayers';
import type { GameObjectType, GameObjectRenderLayer } from '../../../types/object';

export type PinVariant = 'entry' | 'object' | 'character' | 'sublocation' | 'exit';

export interface ScenePinData {
  id: string;
  x: number;
  y: number;
  variant: PinVariant;
  label: string;
  mediaId?: string | null;
  emoji?: string;
  subtitle?: string;
  scale: number;
  rotation: number;
  objectType?: GameObjectType;
  renderLayer?: GameObjectRenderLayer;
}

export interface SceneTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface Props {
  pin: ScenePinData;
  selected: boolean;
  hovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onTransformEnd: (id: string, patch: SceneTransform) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  obstacles?: IdentifiedBounds[];
  sceneWidth?: number;
  sceneHeight?: number;
  zoom?: number;
  baseSize?: number;
  canTransform?: boolean;
  collidable?: boolean;
  onSizeResolved?: (id: string, size: { w: number; h: number }) => void;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 10;

const VARIANT_ACCENT: Record<PinVariant, string> = {
  entry: '#4a8a4a',
  object: '#c9a24a',
  character: '#9c1c1c',
  sublocation: '#c9a24a',
  exit: '#9c1c1c',
};

type DragMode = 'idle' | 'move' | 'resize' | 'rotate';

export function computePinSize(
  baseSize: number,
  natural: ImageSize | null
): { w: number; h: number } {
  if (!natural || natural.width <= 0 || natural.height <= 0) {
    return { w: baseSize, h: baseSize };
  }
  const aspect = natural.width / natural.height;
  if (aspect >= 1) {
    return { w: baseSize, h: Math.round(baseSize / aspect) };
  }
  return { w: Math.round(baseSize * aspect), h: baseSize };
}

function buildFilter(
  state: 'idle' | 'hover' | 'selected',
  accent: string
): string {
  const shadow = 'drop-shadow(0 4px 10px rgba(0,0,0,0.75))';
  if (state === 'selected') {
    const outline = accent;
    const contour = [
      `drop-shadow(1px 0 0 ${outline})`,
      `drop-shadow(-1px 0 0 ${outline})`,
      `drop-shadow(0 1px 0 ${outline})`,
      `drop-shadow(0 -1px 0 ${outline})`,
    ].join(' ');
    return `${shadow} ${contour}`;
  }
  return shadow;
}

export function ScenePin({
  pin,
  selected,
  hovered,
  onSelect,
  onHover,
  onTransformEnd,
  containerRef,
  obstacles = [],
  sceneWidth = 1200,
  sceneHeight = 800,
  baseSize = 90,
  canTransform = true,
  collidable = true,
  onSizeResolved,
}: Props) {
  const url = useMediaUrl(pin.mediaId ?? null);
  const naturalSize = useImageSize(url);
  const { w: baseW, h: baseH } = computePinSize(baseSize, naturalSize);

  const [pos, setPos] = useState({ x: pin.x, y: pin.y });
  const [scale, setScale] = useState(pin.scale);
  const [rotation, setRotation] = useState(pin.rotation);
  const [dragging, setDragging] = useState(false);

  const fullW = baseW * scale;
  const fullH = baseH * scale;

  useEffect(() => {
    onSizeResolved?.(pin.id, { w: fullW, h: fullH });
  }, [pin.id, fullW, fullH, onSizeResolved]);

  const posRef = useRef(pos);
  const scaleRef = useRef(scale);
  const rotationRef = useRef(rotation);
  const dragModeRef = useRef<DragMode>('idle');
  const movedRef = useRef(false);
  const initialCollisionsRef = useRef<Set<string>>(new Set());

  const obstaclesRef = useRef(obstacles);
  const onTransformEndRef = useRef(onTransformEnd);
  const onSelectRef = useRef(onSelect);
  const baseSizeRef = useRef({ w: baseW, h: baseH });

  useEffect(() => {
    obstaclesRef.current = obstacles;
    onTransformEndRef.current = onTransformEnd;
    onSelectRef.current = onSelect;
    baseSizeRef.current = { w: baseW, h: baseH };
  }, [obstacles, onTransformEnd, onSelect, baseW, baseH]);

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
    setPos({ x: pin.x, y: pin.y });
    setScale(pin.scale);
    setRotation(pin.rotation);
  }, [pin.x, pin.y, pin.scale, pin.rotation]);

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

  const toPct = (px: number, axis: 'w' | 'h') =>
    (px / (axis === 'w' ? sceneWidth : sceneHeight)) * 100;

  const selfBounds = (
    p: { x: number; y: number },
    sc: number
  ): IdentifiedBounds => {
    const { w: bw, h: bh } = baseSizeRef.current;
    return {
      id: pin.id,
      x: p.x,
      y: p.y,
      halfW: toPct((bw * sc) / 2, 'w'),
      halfH: toPct((bh * sc) / 2, 'h'),
    };
  };

  const startDrag =
    (mode: DragMode) => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const s = posRef.current;
      const sc = scaleRef.current;
      const cx = rect.left + (s.x / 100) * rect.width;
      const cy = rect.top + (s.y / 100) * rect.height;

      const dist = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
      const angle =
        (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;

      if (collidable) {
        initialCollisionsRef.current = collectInitialCollisions(
          selfBounds(s, sc),
          obstaclesRef.current,
          pin.id
        );
      } else {
        initialCollisionsRef.current = new Set();
      }

      movedRef.current = false;
      dragInfo.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        posX: s.x,
        posY: s.y,
        scale: sc,
        rotation: rotationRef.current,
        centerX: cx,
        centerY: cy,
        startDist: dist,
        startAngle: angle,
      };
      dragModeRef.current = mode;
      setDragging(true);
    };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const mode = dragModeRef.current;
      if (mode === 'idle') return;

      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const s = dragInfo.current;
      if (
        Math.abs(e.clientX - s.mouseX) > 3 ||
        Math.abs(e.clientY - s.mouseY) > 3
      ) {
        movedRef.current = true;
      }

      const curScale = scaleRef.current;

      if (mode === 'move') {
        const rawX = clamp(
          s.posX + ((e.clientX - s.mouseX) / rect.width) * 100,
          0,
          100
        );
        const rawY = clamp(
          s.posY + ((e.clientY - s.mouseY) / rect.height) * 100,
          0,
          100
        );

        if (!collidable) {
          setPos({ x: rawX, y: rawY });
          return;
        }

        const ignore = initialCollisionsRef.current;

        let nx = s.posX;
        const boundsX = selfBounds({ x: rawX, y: s.posY }, curScale);
        if (
          !collidesWithAny(boundsX, obstaclesRef.current, pin.id, ignore)
        ) {
          nx = rawX;
        }

        let ny = s.posY;
        const boundsY = selfBounds({ x: nx, y: rawY }, curScale);
        if (
          !collidesWithAny(boundsY, obstaclesRef.current, pin.id, ignore)
        ) {
          ny = rawY;
        }

        setPos({ x: nx, y: ny });
        return;
      }

      if (mode === 'resize') {
        const dist = Math.hypot(e.clientX - s.centerX, e.clientY - s.centerY);
        const next = clamp(
          s.scale * (dist / s.startDist),
          MIN_SCALE,
          MAX_SCALE
        );

        if (!collidable) {
          setScale(next);
          return;
        }

        const tryBounds = selfBounds({ x: s.posX, y: s.posY }, next);
        if (
          !collidesWithAny(
            tryBounds,
            obstaclesRef.current,
            pin.id,
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
          onTransformEndRef.current(pin.id, {
            x: cur.pos.x,
            y: cur.pos.y,
            scale: cur.scale,
            rotation: cur.rotation,
          });
        } else {
          onSelectRef.current(pin.id);
        }
      } else if (mode === 'move') {
        onSelectRef.current(pin.id);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [containerRef, pin.id, collidable]);

  const isActive = selected || hovered;

  /* Слой: персонаж — поверх всех объектов; объект — свой слой;
     остальные (entry / sublocation / exit) — обычный. */
  const layer = resolvePinLayer(pin.variant, pin.objectType, pin.renderLayer);
  const baseZ = computePinZ(layer, pos.y);

  const zIndex = selected
    ? baseZ + Z_OFFSET_SELECTED
    : hovered
    ? baseZ + Z_OFFSET_HOVERED
    : baseZ;

  const filter = buildFilter(
    selected ? 'selected' : hovered ? 'hover' : 'idle',
    VARIANT_ACCENT[pin.variant]
  );

  const cornerHandles: Array<{
    key: 'tl' | 'tr' | 'bl' | 'br';
    style: React.CSSProperties;
    cursor: string;
  }> = [
    { key: 'tl', style: { top: -7, left: -7 }, cursor: 'nwse-resize' },
    { key: 'tr', style: { top: -7, right: -7 }, cursor: 'nesw-resize' },
    { key: 'bl', style: { bottom: -7, left: -7 }, cursor: 'nesw-resize' },
    { key: 'br', style: { bottom: -7, right: -7 }, cursor: 'nwse-resize' },
  ];

  return (
    <div
      role="button"
      tabIndex={0}
      data-no-pan="true"
      onMouseDown={startDrag('move')}
      onMouseEnter={() => onHover(pin.id)}
      onMouseLeave={() => onHover(null)}
      className={
        'absolute select-none ' +
        (dragging ? 'cursor-grabbing ' : 'cursor-grab ')
      }
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: fullW,
        height: fullH,
        zIndex,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transformOrigin: 'center',
        transition: dragging ? 'none' : 'width 120ms ease, height 120ms ease',
      }}
    >
      {url ? (
        <img
          src={url}
          alt={pin.label}
          draggable={false}
          className="w-full h-full object-contain pointer-events-none select-none"
          style={{ filter }}
        />
      ) : (
        <img
          src="/images/logo.png"
          alt={pin.label}
          draggable={false}
          className="w-full h-full object-contain pointer-events-none select-none"
          style={{
            filter,
            opacity: isActive ? 1 : 0.8,
          }}
        />
      )}

      {isActive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: `1.5px dashed ${selected ? '#9c1c1c' : `${VARIANT_ACCENT[pin.variant]}aa`}`,
            borderRadius: 4,
          }}
        />
      )}

      {isActive && (
        <div
          className="absolute left-1/2 pointer-events-none"
          style={{
            top: '100%',
            transform: `translate(-50%, 6px) rotate(${-rotation}deg)`,
            transformOrigin: 'top center',
            marginTop: 4,
          }}
        >
          <span
            className="type text-[10px] uppercase tracking-[0.2em]
                       bg-ink/95 border border-brass/50 text-bone
                       px-2 py-0.5 whitespace-nowrap inline-block"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            {pin.label}
          </span>
          {pin.subtitle && (
            <span
              className="type text-[9px] uppercase tracking-[0.22em]
                         text-bone-muted block text-center mt-0.5
                         bg-ink/80 px-1.5 py-0.5"
            >
              {pin.subtitle}
            </span>
          )}
        </div>
      )}

      {isActive && canTransform && (
        <>
          {cornerHandles.map((h2) => (
            <div
              key={h2.key}
              data-no-pan="true"
              onMouseDown={startDrag('resize')}
              className="absolute"
              style={{
                width: 14,
                height: 14,
                background: '#ece2c9',
                border: '2px solid #9c1c1c',
                borderRadius: 2,
                cursor: h2.cursor,
                boxShadow: '0 2px 6px rgba(0,0,0,0.7)',
                ...h2.style,
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
              boxShadow: '0 2px 6px rgba(0,0,0,0.7)',
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