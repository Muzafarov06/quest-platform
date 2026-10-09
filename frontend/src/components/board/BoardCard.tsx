import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import type { BoardItem, BoardItemType } from '../../types/board';

/**
 * Ширина карточки. Увеличена с 240 до 300 — заголовки улик и заметок
 * должны помещаться целиком, без обрезки.
 */
export const CARD_WIDTH = 300;

/**
 * Высота карточки по типу. Пропорционально увеличена под новую ширину.
 * EVIDENCE — самая высокая (картинка + название + описание).
 */
export const CARD_HEIGHT: Record<BoardItemType, number> = {
  EVIDENCE: 440,
  NOTE: 320,
  HYPOTHESIS: 360,
  QUESTION: 280,
};

interface Props {
  item: BoardItem;
  zoom: number;
  selected: boolean;
  /** UUID медиа улики для превью. null — нет картинки. */
  evidenceMediaId?: string | null;
  onSelect: (id: string) => void;
  onOpen: (item: BoardItem) => void;
  onDelete: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onDragStart?: () => void;
}

export function BoardCard({
  item,
  zoom,
  selected,
  evidenceMediaId = null,
  onSelect,
  onOpen,
  onDelete,
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

      // Останавливаем событие, чтобы MapPanContainer не начал панорамирование.
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
        onSelect(item.id);
        onOpen(item);
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, zoom, item, onPositionChange, onSelect, onOpen, pos.x, pos.y]);

  const H = CARD_HEIGHT[item.itemType];
  const tilt = ((item.id.charCodeAt(0) + item.id.charCodeAt(1)) % 5) - 2;

  /* Hover — лёгкий подъём и увеличение. Не мешает drag. */
  const hoverLift = hovered && !dragging ? 4 : 0;
  const hoverScale = hovered && !dragging ? 1.02 : 1;

  return (
    <div
      /**
       * data-no-pan говорит MapPanContainer: «этот элемент перетаскиваем
       * мы, не начинай панорамирование».
       */
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
        transform: `translateY(-${hoverLift}px) scale(${hoverScale})`,
        transformOrigin: 'top center',
        transition: dragging
          ? 'none'
          : 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
    >
      {/* Булавка */}
      <div
        className={
          'pin ' +
          (item.itemType === 'HYPOTHESIS' || item.itemType === 'QUESTION'
            ? 'brass '
            : '')
        }
        style={{ top: -8, left: '50%', marginLeft: -7, zIndex: 20 }}
      />

      {/* Тело карточки */}
      <div
        className="w-full h-full"
        style={{ transform: `rotate(${tilt}deg)`, transformOrigin: 'top center' }}
      >
        {item.itemType === 'EVIDENCE' && (
          <EvidenceVisual item={item} mediaId={evidenceMediaId} />
        )}
        {item.itemType === 'NOTE' && <NoteVisual item={item} />}
        {item.itemType === 'HYPOTHESIS' && <HypothesisVisual item={item} />}
        {item.itemType === 'QUESTION' && <QuestionVisual item={item} />}
      </div>

      {/* Оверлей выделения */}
      {selected && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '1px solid rgba(156,28,28,0.8)',
            boxShadow:
              '0 0 14px rgba(156,28,28,0.55), inset 0 0 14px rgba(156,28,28,0.15)',
          }}
        />
      )}

      {/* Кнопка удаления */}
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

/* ═══════════════════════════════════════════════════════════
   Виды карточек — все в стиле пергамента сайта
   ═══════════════════════════════════════════════════════════ */

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
      {/* Штамп «Улика» */}
      <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
        <span className="stamp-red text-[11px]">Улика</span>
      </div>

      {/* Превью улики: фиксированная пропорция 4:3, object-contain. */}
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

      {/* Подпись */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="type text-[11px] uppercase tracking-[0.24em] text-ink-text-dim mb-1.5">
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
    </div>
  );
}

function NoteVisual({ item }: { item: BoardItem }) {
  return (
    <div className="paper paper-fresh relative w-full h-full flex flex-col p-5">
      {/* Штамп «Заметка» */}
      <div className="absolute top-3 right-3 z-10">
        <span className="type text-[10px] uppercase tracking-[0.24em] text-ink-text-dim">
          Заметка
        </span>
      </div>

      {item.title && (
        <div
          className="font-poster text-[18px] leading-[1.15] text-ink-text mb-3 pr-16
                     line-clamp-3 break-words"
        >
          {item.title}
        </div>
      )}

      <div
        className="flex-1 overflow-hidden"
        style={{
          fontFamily: 'var(--font-hand, cursive)',
          color: 'rgba(42,35,24,0.88)',
          fontSize: 24,
          lineHeight: 1.15,
          fontWeight: 500,
        }}
      >
        <p className="whitespace-pre-line line-clamp-5 break-words">
          {item.content ?? ''}
        </p>
      </div>
    </div>
  );
}

function HypothesisVisual({ item }: { item: BoardItem }) {
  return (
    <div className="paper paper-old relative w-full h-full flex flex-col p-5">
      {/* Красная линия сверху */}
      <div className="absolute top-0 left-4 right-4 h-px bg-blood/70" />

      <div className="flex items-baseline justify-between gap-2 mb-3 mt-2">
        <span className="type text-[11px] uppercase tracking-[0.26em] text-blood">
          Гипотеза
        </span>
        <span className="hand text-[16px] text-blood/70 rotate-[-2deg]">
          ?
        </span>
      </div>

      {item.title && (
        <div
          className="font-poster text-[18px] leading-[1.15] text-ink-text mb-3
                     line-clamp-3 break-words"
        >
          {item.title}
        </div>
      )}

      <div
        className="text-[14px] text-ink-text-soft leading-snug flex-1 overflow-hidden
                   break-words"
        style={{ fontFamily: 'var(--font-type, monospace)' }}
      >
        <p className="whitespace-pre-line line-clamp-6">{item.content ?? ''}</p>
      </div>
    </div>
  );
}

function QuestionVisual({ item }: { item: BoardItem }) {
  return (
    <div className="paper paper-fresh relative w-full h-full flex flex-col items-center justify-center p-5">
      <div className="font-poster text-[80px] leading-none text-blood/75 mb-1">
        ?
      </div>
      <div className="type text-[11px] uppercase tracking-[0.26em] text-ink-text-dim mb-3">
        Вопрос
      </div>
      <div
        className="font-poster text-[16px] leading-tight text-ink-text text-center
                   line-clamp-4 break-words"
      >
        {item.title ?? item.content ?? ''}
      </div>
    </div>
  );
}