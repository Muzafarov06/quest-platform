import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import type { BoardItem } from '../../types/board';

export const CARD_WIDTH = 320;
export const CARD_HEIGHT = 460;

interface Props {
  item: BoardItem;
  zoom: number;
  evidenceMediaId?: string | null;
  onDelete: (id: string) => void;
  onOpen: (item: BoardItem) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onDragStart?: () => void;
}

export function BoardCard({
  item,
  zoom,
  evidenceMediaId = null,
  onDelete,
  onOpen,
  onPositionChange,
  onDragStart,
}: Props) {
  const [pos, setPos] = useState({ x: item.posX, y: item.posY });
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  const dragStart = useRef({
    mouseX: 0,
    mouseY: 0,
    cardX: 0,
    cardY: 0,
    moved: false,
  });

  useEffect(() => {
    if (!dragging) setPos({ x: item.posX, y: item.posY });
  }, [item.posX, item.posY, dragging]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest('[data-card-action]')) return;

      e.stopPropagation();
      e.preventDefault();

      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        cardX: pos.x,
        cardY: pos.y,
        moved: false,
      };
      setDragging(true);
      onDragStart?.();
    },
    [pos.x, pos.y, onDragStart]
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.current.mouseX) / zoom;
      const dy = (e.clientY - dragStart.current.mouseY) / zoom;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragStart.current.moved = true;
      setPos({
        x: Math.max(0, dragStart.current.cardX + dx),
        y: Math.max(0, dragStart.current.cardY + dy),
      });
    };
    const onUp = () => {
      setDragging(false);
      if (dragStart.current.moved) {
        onPositionChange(item.id, pos.x, pos.y);
      } else {
        onOpen(item);
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, zoom, item, onPositionChange, onOpen, pos.x, pos.y]);

  const H = CARD_HEIGHT;
  const tilt = ((item.id.charCodeAt(0) + item.id.charCodeAt(1)) % 5) - 2;
  const hoverLift = hovered && !dragging ? 4 : 0;

  return (
    <div
      data-no-pan="true"
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={
        'absolute select-none ' +
        (dragging ? 'cursor-grabbing z-50 ' : 'cursor-grab z-30 ')
      }
      style={{
        left: pos.x,
        top: pos.y,
        width: CARD_WIDTH,
        height: H,
        willChange: 'transform',
        transform: `translateY(-${hoverLift}px)`,
        transformOrigin: 'top center',
        transition: dragging ? 'none' : 'transform 180ms ease-out',
      }}
    >
      <div
        className="pin"
        style={{ top: -8, left: '50%', marginLeft: -7, zIndex: 20 }}
      />

      <div
        className="w-full h-full"
        style={{ transform: `rotate(${tilt}deg)`, transformOrigin: 'top center' }}
      >
        <EvidenceVisual item={item} mediaId={evidenceMediaId} />
      </div>

      {hovered && !dragging && (
        <button
          type="button"
          data-card-action
          data-no-pan="true"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          title="Убрать с доски"
          className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center
                     bg-ink text-blood border border-blood/60
                     type text-[12px] leading-none
                     hover:bg-blood hover:text-paper
                     transition-colors cursor-pointer z-30"
          style={{ boxShadow: '0 3px 8px rgba(0,0,0,0.85)' }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

function EvidenceVisual({
  item,
  mediaId,
}: {
  item: BoardItem;
  mediaId: string | null;
}) {
  const url = useMediaUrl(mediaId);

  return (
    <div className="paper paper-old relative w-full h-full flex flex-col p-4">
      <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
        <span className="stamp-red text-[11px]">Улика</span>
      </div>

      <div className="relative w-full aspect-[4/3] mb-3 flex items-center justify-center">
        {url ? (
          <img
            src={url}
            alt={item.title ?? ''}
            draggable={false}
            className="max-w-full max-h-full object-contain select-none"
            style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))' }}
          />
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            className="w-16 h-16 text-ink-text-dim/40"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3 v2 M12 19 v2 M3 12 h2 M19 12 h2" />
          </svg>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="type text-[10px] uppercase tracking-[0.24em] text-ink-text-dim mb-1.5">
          Улика
        </div>
        <div
          className="font-poster text-[18px] leading-[1.15] text-ink-text mb-2
                     line-clamp-3 break-words"
        >
          {item.title ?? 'Без названия'}
        </div>
        {item.content && (
          <p
            className="text-[13px] text-ink-text-soft leading-snug line-clamp-4
                       break-words"
            style={{ fontFamily: 'var(--font-type, monospace)' }}
          >
            {item.content}
          </p>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-dashed border-ink-text/25
                      flex items-center gap-2">
        <span className="shrink-0 text-base leading-none" aria-hidden="true">🖐</span>
        <span className="type text-[10px] uppercase tracking-[0.22em]
                         text-ink-text-dim truncate">
          нашёл: <span className="text-blood">{item.createdByName ?? '—'}</span>
        </span>
      </div>
    </div>
  );
}