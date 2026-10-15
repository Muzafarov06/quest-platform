// frontend/src/components/FigureModal.tsx
import { useEffect } from 'react';
import { FigureImage } from './FigureImage';
import { useFigures } from '../hooks/useFigures';
import type { Figure } from '../types/figure';
import type { SessionPlayer } from '../types/session';

interface Props {
  players: SessionPlayer[];
  mePlayerId: string;
  onPick: (code: string) => void;
  onClose: () => void;
  busy?: boolean;
}

export function FigureModal({
  players,
  mePlayerId,
  onPick,
  onClose,
  busy,
}: Props) {
  const figures = useFigures();

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const takenBy = (code: string) =>
    players.find((p) => p.active && p.avatarKey === code && p.id !== mePlayerId);

  const myCode = players.find((p) => p.id === mePlayerId)?.avatarKey ?? '';

  const total = figures?.length ?? 0;
  const free = figures
    ? figures.filter((f) => !takenBy(f.code)).length
    : 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4
                 bg-ink/95"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Шкаф фигурок"
    >
      {/* Корпус сундука */}
      <div
        className="relative w-full max-w-[1500px] flex flex-col
                   border-2 border-brass/55
                   bg-[#0e0c08]
                   max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(201,162,74,0.22), ' +
            'inset 0 0 0 1px rgba(0,0,0,0.7), ' +
            '0 30px 80px rgba(0,0,0,0.95), ' +
            '0 0 90px rgba(201,162,74,0.05)',
        }}
      >
        {/* Уголки сундука */}
        <Corner pos="tl" />
        <Corner pos="tr" />
        <Corner pos="bl" />
        <Corner pos="br" />

        {/* Нить-разделитель сверху */}
        <div
          className="pointer-events-none absolute inset-x-3 top-3 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(156,28,28,0.55) 20%, rgba(156,28,28,0.55) 80%, transparent)',
          }}
        />

        {/* ─────────── Шапка ─────────── */}
        <header
          className="relative flex items-center justify-between gap-4
                     px-5 sm:px-8 py-4 border-b border-brass/30 shrink-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,16,10,0.95) 0%, rgba(14,12,8,0.85) 100%)',
          }}
        >
          <div className="flex items-baseline gap-3 sm:gap-4 flex-wrap min-w-0">
            <span
              className="type text-[11px] sm:text-[12px] uppercase tracking-[0.32em] text-brass whitespace-nowrap"
            >
              Шкаф фигурок
            </span>
            <span className="hidden sm:block w-px h-4 bg-brass/40" />
            <span className="hidden sm:inline type text-[11px] uppercase tracking-[0.28em] text-bone-muted whitespace-nowrap">
              Выбрать образ
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="shrink-0 w-9 h-9 flex items-center justify-center
                       text-bone-muted hover:text-blood
                       type text-xl leading-none
                       transition-colors cursor-pointer"
          >
            ✕
          </button>
        </header>

        {/* ─────────── Скролл-область ─────────── */}
        <div className="scroll-map min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 sm:px-8 py-6 sm:py-8">

            {/* Заголовок + подсказка */}
            <div className="mb-7 sm:mb-9 flex flex-col gap-3">
              <h2
                className="font-poster text-3xl sm:text-4xl md:text-5xl
                           text-texture-bone leading-[0.9] uppercase"
              >
                Кем будете?
              </h2>
              <span
                className="hand text-lg sm:text-2xl text-blood w-fit"
                style={{ transform: 'rotate(-1.5deg)' }}
              >
                фигурку нельзя передать — она ваша до конца сессии
              </span>
            </div>

            {/* Загрузка */}
            {figures === null && (
              <div className="py-12 text-center
                              type text-[13px] uppercase tracking-[0.28em] text-bone-muted">
                Достаём фигурки…
              </div>
            )}

            {/* Пусто */}
            {figures && figures.length === 0 && (
              <div className="py-12 text-center
                              type text-[13px] uppercase tracking-[0.28em] text-bone-muted">
                В шкафу пока пусто
              </div>
            )}

            {/* Витрина */}
            {figures && figures.length > 0 && (
              <ShelfGrid
                figures={figures}
                myCode={myCode}
                takenBy={takenBy}
                busy={!!busy}
                onPick={onPick}
              />
            )}
          </div>
        </div>

        {/* ─────────── Подвал ─────────── */}
        <footer
          className="relative flex items-center justify-between gap-4
                     px-5 sm:px-8 py-3.5 border-t border-brass/30 shrink-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(14,12,8,0.9) 0%, rgba(20,16,10,0.95) 100%)',
          }}
        >
          <span
            className="type text-[11px] sm:text-[12px] uppercase tracking-[0.26em] text-bone-muted
                       whitespace-nowrap"
          >
            Свободных:{' '}
            <span className="text-bone tabular-nums">{free}</span>
            <span className="text-bone-dim"> / </span>
            <span className="tabular-nums">{total}</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="type text-[11px] sm:text-[12px] uppercase tracking-[0.28em]
                       text-blood hover:text-blood-hover transition-colors
                       cursor-pointer whitespace-nowrap"
          >
            Закрыть шкаф →
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ============================================================
   Витрина с «полками»
   ============================================================ */

interface ShelfGridProps {
  figures: Figure[];
  myCode: string;
  takenBy: (code: string) => SessionPlayer | undefined;
  busy: boolean;
  onPick: (code: string) => void;
}

function ShelfGrid({ figures, myCode, takenBy, busy, onPick }: ShelfGridProps) {
  /**
   * Разбиваем на «полки» симметрично: 5+5, 4+4 и т.д.
   * Так выглядит как настоящий стеллаж, а не как один большой грид.
   */
  const shelfSizes = (() => {
    const n = figures.length;
    if (n === 0) return [] as number[];
    if (n <= 5) return [n];
    if (n <= 10) {
      const first = Math.ceil(n / 2);
      return [first, n - first];
    }
    const perShelf = Math.ceil(n / 3);
    const shelves: number[] = [];
    let left = n;
    while (left > 0) {
      const take = Math.min(perShelf, left);
      shelves.push(take);
      left -= take;
    }
    return shelves;
  })();

  let index = 0;
  const shelves: Figure[][] = shelfSizes.map((size) => {
    const slice = figures.slice(index, index + size);
    index += size;
    return slice;
  });

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {shelves.map((shelfFigures, shelfIdx) => (
        <div key={shelfIdx} className="relative">
          <div
            className="grid gap-x-3 sm:gap-x-5 gap-y-4"
            style={{
              gridTemplateColumns: `repeat(${shelfFigures.length}, minmax(0, 1fr))`,
            }}
          >
            {shelfFigures.map((fig) => {
              const taken = takenBy(fig.code);
              const isMine = myCode === fig.code;
              const disabled = !!taken || busy;

              return (
                <FigureSlot
                  key={fig.id}
                  code={fig.code}
                  label={fig.label}
                  takenName={taken?.displayName ?? null}
                  isMine={isMine}
                  disabled={disabled}
                  busy={busy}
                  onPick={onPick}
                />
              );
            })}
          </div>

          <Shelf />
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Одна фигурка на полке
   ============================================================ */

interface FigureSlotProps {
  code: string;
  label: string;
  takenName: string | null;
  isMine: boolean;
  disabled: boolean;
  busy: boolean;
  onPick: (code: string) => void;
}

function FigureSlot({
  code,
  label,
  takenName,
  isMine,
  disabled,
  busy,
  onPick,
}: FigureSlotProps) {
  const isTaken = !!takenName && !isMine;
  const interactive = !disabled && !isMine;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => interactive && onPick(code)}
      className={
        'group relative flex flex-col items-center pb-3 ' +
        (disabled
          ? 'cursor-not-allowed'
          : interactive
          ? 'cursor-pointer'
          : 'cursor-default')
      }
      style={{
        contain: 'layout style',
      }}
    >
      {/* ── Сама фигурка ── */}
      <div
        className={
          'relative w-full aspect-[3/4] flex items-end justify-center ' +
          (isTaken ? 'grayscale opacity-35 ' : '')
        }
      >
        {interactive && (
          <div
            className="pointer-events-none absolute inset-0 opacity-0
                       group-hover:opacity-100 transition-opacity duration-200"
            style={{
              background:
                'radial-gradient(ellipse 60% 55% at 50% 60%, rgba(201,162,74,0.20), transparent 70%)',
            }}
          />
        )}

        <FigureImage
          code={code}
          alt={label}
          className={
            'relative w-full h-full object-contain ' +
            'transition-transform duration-200 will-change-transform ' +
            (interactive ? 'group-hover:-translate-y-1 ' : '')
          }
        />

        {isMine && (
          <span
            className="absolute -top-1 left-1/2 -translate-x-1/2
                       type text-[9px] sm:text-[10px] uppercase tracking-[0.22em]
                       bg-blood text-paper px-2.5 py-0.5
                       rotate-[-3deg] whitespace-nowrap z-10"
            style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.8)' }}
          >
            ● сейчас вы
          </span>
        )}

        {isTaken && !isMine && (
          <span
            className="absolute bottom-1 left-1/2 -translate-x-1/2
                       type text-[9px] uppercase tracking-[0.18em]
                       bg-ink/95 border border-bone/30
                       text-bone-muted px-2 py-0.5
                       whitespace-nowrap max-w-[95%] truncate z-10"
          >
            занято · {takenName}
          </span>
        )}

        {busy && interactive && (
          <span
            className="absolute inset-0 flex items-center justify-center
                       bg-ink/70 type text-[10px] uppercase tracking-[0.24em]
                       text-brass"
          >
            ⋯
          </span>
        )}
      </div>

      {/* ── Подпись под фигуркой ── */}
      <div
        className={
          'mt-3 type text-[10px] sm:text-[11px] uppercase tracking-[0.18em] ' +
          'text-center leading-tight transition-colors duration-200 ' +
          (isMine
            ? 'text-blood'
            : isTaken
            ? 'text-bone-dim'
            : 'text-bone group-hover:text-brass')
        }
      >
        {label}
      </div>
    </button>
  );
}

/* ============================================================
   Полка
   ============================================================ */

function Shelf() {
  return (
    <div className="relative mt-3" aria-hidden="true">
      <div
        className="h-[3px] w-full"
        style={{
          background:
            'linear-gradient(180deg, rgba(201,162,74,0.85) 0%, rgba(168,112,60,0.7) 55%, rgba(106,84,36,0.9) 100%)',
          boxShadow:
            '0 1px 0 rgba(0,0,0,0.9), 0 -1px 0 rgba(255,220,140,0.15) inset',
        }}
      />
      <div
        className="h-3 w-full"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.0) 100%)',
        }}
      />

      <ShelfNail side="left" />
      <ShelfNail side="right" />
    </div>
  );
}

function ShelfNail({ side }: { side: 'left' | 'right' }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: -2,
        left: side === 'left' ? -2 : undefined,
        right: side === 'right' ? -2 : undefined,
        width: 8,
        height: 8,
        borderRadius: '50%',
        background:
          'radial-gradient(circle at 32% 30%, #f0d47a 0%, #c9a24a 45%, #6a5424 100%)',
        boxShadow:
          '0 1px 2px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
      }}
    />
  );
}

/* ============================================================
   Уголки сундука
   ============================================================ */

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 16;
  const style: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    borderColor: 'rgba(201,162,74,0.9)',
    pointerEvents: 'none',
    zIndex: 2,
  };
  if (pos === 'tl') {
    style.top = -1; style.left = -1;
    style.borderTopWidth = 2; style.borderLeftWidth = 2;
  } else if (pos === 'tr') {
    style.top = -1; style.right = -1;
    style.borderTopWidth = 2; style.borderRightWidth = 2;
  } else if (pos === 'bl') {
    style.bottom = -1; style.left = -1;
    style.borderBottomWidth = 2; style.borderLeftWidth = 2;
  } else {
    style.bottom = -1; style.right = -1;
    style.borderBottomWidth = 2; style.borderRightWidth = 2;
  }
  return <span style={style} />;
}