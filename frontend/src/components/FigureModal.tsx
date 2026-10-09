import { useEffect } from 'react';
import { FigureImage } from './FigureImage';
import { useFigures } from '../hooks/useFigures';
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
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const takenBy = (code: string) =>
    players.find((p) => p.active && p.avatarKey === code && p.id !== mePlayerId);

  const myCode = players.find((p) => p.id === mePlayerId)?.avatarKey ?? '';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6
                 bg-ink/85 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* ─────────── Сундук, из которого «достают» фигурки ─────────── */}
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col
                   border-2 border-brass/50 bg-ink/95"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(201,162,74,0.2), ' +
            'inset 0 0 0 1px rgba(0,0,0,0.6), ' +
            '0 24px 60px rgba(0,0,0,0.9), ' +
            '0 0 60px rgba(201,162,74,0.06)',
        }}
      >
        {/* Золотые уголки */}
        <Corner pos="tl" />
        <Corner pos="tr" />
        <Corner pos="bl" />
        <Corner pos="br" />

        {/* ─────────── Верхняя плашка ─────────── */}
        <div className="flex items-center justify-between gap-4
                        px-5 sm:px-8 py-4 border-b border-brass/30">
          <div className="flex items-baseline gap-3 sm:gap-4 flex-wrap">
            <span className="type text-[11px] sm:text-[12px] uppercase tracking-[0.32em] text-brass">
              Шкаф фигурок
            </span>
            <span className="hidden sm:block w-px h-4 bg-brass/40" />
            <span className="type text-[11px] sm:text-[12px] uppercase tracking-[0.28em] text-bone-muted">
              Выбрать образ
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="w-9 h-9 flex items-center justify-center
                       text-bone-muted hover:text-blood
                       type text-xl leading-none
                       transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* ─────────── Основной блок ─────────── */}
        <div className="overflow-y-auto px-5 sm:px-8 py-6 sm:py-8">

          {/* Заголовок + подсказка */}
          <div className="mb-7 sm:mb-9 flex flex-col gap-3">
            <h2 className="font-poster text-3xl sm:text-4xl md:text-5xl
                           text-texture-bone leading-[0.9] uppercase">
              Кем будете?
            </h2>
            <span className="hand text-xl sm:text-2xl text-blood rotate-[-1.5deg] w-fit">
              фигурку нельзя передать — она ваша до конца сессии
            </span>
          </div>

          {/* Загрузка */}
          {figures === null && (
            <div className="py-10 text-center
                            type text-[13px] uppercase tracking-[0.28em] text-bone-muted">
              Достаём фигурки…
            </div>
          )}

          {/* Пусто */}
          {figures && figures.length === 0 && (
            <div className="py-10 text-center
                            type text-[13px] uppercase tracking-[0.28em] text-bone-muted">
              В шкафу пока пусто
            </div>
          )}

          {/* Витрина — фигурки рядом друг с другом, без фонов */}
          {figures && figures.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5
                            gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8">
              {figures.map((fig) => {
                const taken = takenBy(fig.code);
                const isMine = myCode === fig.code;
                const disabled = !!taken || !!busy;

                return (
                  <button
                    key={fig.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => !isMine && !taken && onPick(fig.code)}
                    className={
                      'group relative flex flex-col items-center ' +
                      'transition-transform duration-200 ' +
                      (disabled
                        ? 'cursor-not-allowed'
                        : 'cursor-pointer hover:-translate-y-1')
                    }
                  >
                    {/* Фигурка — без фона, без рамки */}
                    <div
                      className={
                        'relative w-full aspect-[3/4] flex items-end justify-center ' +
                        (taken ? 'grayscale opacity-35' : '')
                      }
                    >
                      <FigureImage
                        code={fig.code}
                        alt={fig.label}
                        className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
                      />

                      {/* Моя текущая фигурка — отметка */}
                      {isMine && (
                        <span
                          className="absolute -top-1 left-1/2 -translate-x-1/2
                                     type text-[10px] uppercase tracking-[0.22em]
                                     bg-blood text-paper px-2.5 py-0.5
                                     rotate-[-3deg] whitespace-nowrap"
                          style={{
                            boxShadow: '0 2px 6px rgba(0,0,0,0.7)',
                          }}
                        >
                          ● сейчас вы
                        </span>
                      )}

                      {/* Занята другим — плашка снизу */}
                      {taken && !isMine && (
                        <span
                          className="absolute bottom-2 left-1/2 -translate-x-1/2
                                     type text-[10px] uppercase tracking-[0.2em]
                                     bg-ink/90 border border-bone/30
                                     text-bone-muted px-2 py-0.5
                                     whitespace-nowrap max-w-[95%] truncate"
                        >
                          занято · {taken.displayName}
                        </span>
                      )}
                    </div>

                    {/* Имя фигурки под ней */}
                    <div
                      className={
                        'mt-3 type text-[11px] sm:text-[12px] uppercase tracking-[0.2em] ' +
                        'text-center leading-tight ' +
                        (isMine
                          ? 'text-blood'
                          : taken
                          ? 'text-bone-dim'
                          : 'text-bone group-hover:text-brass transition-colors')
                      }
                    >
                      {fig.label}
                    </div>

                    {/* Свечение при ховере — на свободных */}
                    {!disabled && !isMine && (
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0
                                   group-hover:opacity-100 transition-opacity duration-200"
                        style={{
                          background:
                            'radial-gradient(ellipse 60% 60% at 50% 55%, rgba(201,162,74,0.14), transparent 70%)',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─────────── Нижняя подсказка ─────────── */}
        <div className="flex items-center justify-between gap-4
                        px-5 sm:px-8 py-4 border-t border-brass/30">
          <span className="type text-[11px] sm:text-[12px] uppercase tracking-[0.26em] text-bone-muted">
            Свободных: {figures ? figures.filter((f) => !takenBy(f.code)).length : 0}
            {figures && ` / ${figures.length}`}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="type text-[11px] sm:text-[12px] uppercase tracking-[0.28em]
                       text-blood hover:text-blood-hover transition-colors
                       cursor-pointer"
          >
            Закрыть шкаф →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Уголки — золотые, как на сундуке
   ============================================================ */

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 14;
  const style: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    borderColor: 'rgba(201,162,74,0.8)',
    pointerEvents: 'none',
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