import { useCallback, useEffect, useRef, useState } from 'react';
import { useLobbyMovement } from '../hooks/useLobbyMovement';
import { FigureImage } from './FigureImage';
import { FigureModal } from './FigureModal';
import type { SessionPlayer, Facing } from '../types/session';

interface Props {
  sessionId: string;
  players: SessionPlayer[];
  mePlayerId: string | null;
  remotePositions: Map<string, { x: number; y: number; facing: Facing }>;
  onLocalPosition: (x: number, y: number, facing: Facing) => void;
  onToggleReady?: () => void;
  isMeReady?: boolean;
  isReadyBusy?: boolean;
  onPickFigure?: (code: string) => Promise<void> | void;
  fill?: boolean;
}

interface LayoutObject {
  x: number; y: number; w: number; h: number;
  inset: { top: number; right: number; bottom: number; left: number };
}

/* ============================================================
   Стол: коллизия — по видимой столешнице. По бокам врезки
   уменьшены, чтобы можно было подойти ближе.
   ============================================================ */
const TABLE: LayoutObject = {
  x: 18, y: 16, w: 64, h: 62,
  inset: { top: 20, right: 12, bottom: 20, left: 12 },
};

/* ============================================================
   Сундук: отодвинут от левой стены (x = 2 вместо -5).
   PNG внутри с rotate(90deg) + object-contain занимает центр
   ~70% ширины и ~92% высоты контейнера — под это и подобран inset,
   чтобы барьер был строго по видимой части.
   ============================================================ */
const CHEST = { x: -2, y: 28, w: 20, h: 22 };
const CHEST_INSET = { top: -5, right: 10, bottom: -25, left: 20 };

const BUTTON = { size: 'clamp(160px, 22%, 280px)' };
const SAFETY = 0;
const HUD_BOTTOM_Y =90;

export function LobbyRoom({
  sessionId,
  players,
  mePlayerId,
  remotePositions,
  onLocalPosition,
  onToggleReady,
  isMeReady = false,
  isReadyBusy = false,
  onPickFigure,
  fill = false,
}: Props) {
  const myPlayer = players.find((p) => p.id === mePlayerId);
  const roomRef = useRef<HTMLDivElement>(null);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [pickingBusy, setPickingBusy] = useState(false);

  const positionRef = useRef<{ x: number; y: number; facing: Facing }>({
    x: myPlayer?.posX ?? 50,
    y: myPlayer?.posY ?? 70,
    facing: myPlayer?.facing ?? 'UP',
  });

  const clampFn = useCallback((x: number, y: number) => {
    let nx = x;
    let ny = y;

    const afterTable = pushOutOfInner(nx, ny, TABLE, SAFETY);
    nx = afterTable.x;
    ny = afterTable.y;

    const chestBox: LayoutObject = {
      x: CHEST.x, y: CHEST.y, w: CHEST.w, h: CHEST.h,
      inset: CHEST_INSET,
    };
    const afterChest = pushOutOfInner(nx, ny, chestBox, SAFETY);
    nx = afterChest.x;
    ny = afterChest.y;

    nx = Math.max(2, Math.min(98, nx));
    ny = Math.max(4, Math.min(HUD_BOTTOM_Y, ny));

    return { x: nx, y: ny };
  }, []);

  /* ---------- Первичный выталкивающий clamp ---------- */
  const spawnedRef = useRef(false);
  useEffect(() => {
    if (!myPlayer || spawnedRef.current) return;
    spawnedRef.current = true;

    const p = positionRef.current;
    const c = clampFn(p.x, p.y);
    if (c.x !== p.x || c.y !== p.y) {
      positionRef.current.x = c.x;
      positionRef.current.y = c.y;
      onLocalPosition(c.x, c.y, p.facing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPlayer?.id]);

  useLobbyMovement({
    sessionId,
    enabled: !!mePlayerId,
    positionRef,
    clamp: clampFn,
  });

  useEffect(() => {
    if (!mePlayerId) return;
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      if (t - last > 30) {
        last = t;
        const p = positionRef.current;
        onLocalPosition(p.x, p.y, p.facing);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mePlayerId, onLocalPosition]);

  const handleWardrobeClick = () => {
    if (!mePlayerId || !onPickFigure) return;
    setWardrobeOpen(true);
  };

  const handlePick = async (code: string) => {
    if (!onPickFigure) return;
    setPickingBusy(true);
    try {
      await onPickFigure(code);
    } finally {
      setPickingBusy(false);
    }
  };

  const readyCount = players.filter((p) => p.active && p.ready).length;
  const activeCount = players.filter((p) => p.active).length;

  return (
    <div
      ref={roomRef}
      className={
        'relative overflow-hidden select-none ' +
        (fill
          ? 'w-full h-full'
          : 'w-full aspect-[16/10] rounded-xl border-4 border-ink-line shadow-2xl')
      }
      style={{ backgroundColor: '#1a0e06' }}
    >
      <img
        src="/images/floor.png"
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 75% 65% at 50% 55%, rgba(201,162,74,0.05), transparent 60%), ' +
            'radial-gradient(ellipse 95% 85% at 50% 50%, transparent 35%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* Стол */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${TABLE.x}%`,
          top: `${TABLE.y}%`,
          width: `${TABLE.w}%`,
          height: `${TABLE.h}%`,
        }}
      >
        <img
          src="/images/table.png"
          alt="Стол"
          draggable={false}
          className="w-full h-full object-contain select-none"
          style={{ filter: 'drop-shadow(0 25px 45px rgba(0,0,0,0.8))' }}
        />
      </div>

      {/* Кнопка «Готов» — без галочки, только свечение */}
      {onToggleReady && (
        <button
          type="button"
          onClick={onToggleReady}
          disabled={isReadyBusy}
          title={isMeReady ? 'Отменить готовность' : 'Готов'}
          className="absolute z-20 flex items-center justify-center
                    -translate-x-1/2 -translate-y-1/2
                    transition-transform
                    hover:scale-110 active:scale-95
                    disabled:opacity-60 disabled:cursor-not-allowed
                    cursor-pointer"
          style={{
            left: `${TABLE.x + TABLE.w / 2}%`,
            top: `${TABLE.y + TABLE.h / 2}%`,
            width: BUTTON.size,
            height: BUTTON.size,
          }}
        >
          <img
            src="/images/button.png"
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
            style={{
              filter: isMeReady
                ? 'drop-shadow(0 10px 24px rgba(0,0,0,0.85)) drop-shadow(0 0 22px rgba(120,220,120,0.75))'
                : 'drop-shadow(0 10px 24px rgba(0,0,0,0.85)) drop-shadow(0 0 12px rgba(201,162,74,0.25))',
            }}
          />

          {isReadyBusy && (
            <span
              className="relative type text-[14px] uppercase tracking-[0.2em] text-paper"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
            >
              ⋯
            </span>
          )}
        </button>
      )}

      {/* Счётчик готовности — ниже кнопки */}
      {onToggleReady && activeCount > 0 && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: `${TABLE.x + TABLE.w / 2}%`,
            top: `${TABLE.y + TABLE.h / 2}%`,
            transform: 'translate(-50%, calc(-50% + 90px))',
          }}
        >
          <div
            className="px-4 py-1.5 bg-ink/85 border border-brass/50
                       type text-[13px] uppercase tracking-[0.26em] text-brass
                       whitespace-nowrap"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            Готовы: {readyCount} / {activeCount}
          </div>
        </div>
      )}

      {/* Сундук — отодвинут от стены, повёрнут на 90° */}
      <button
        type="button"
        onClick={handleWardrobeClick}
        title="Открыть шкаф с фигурками"
        className="absolute z-10 cursor-pointer group"
        style={{
          left: `${CHEST.x}%`,
          top: `${CHEST.y}%`,
          width: `${CHEST.w}%`,
          height: `${CHEST.h}%`,
        }}
      >
        <img
          src="/images/chest.png"
          alt="Шкаф"
          draggable={false}
          className="w-full h-full object-contain select-none
                     transition-transform duration-200
                     group-hover:scale-105"
          style={{
            transform: 'rotate(90deg)',
            filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.75))',
          }}
        />
      </button>

      {/* Игроки */}
      {players
        .filter((p) => p.active)
        .map((p) => {
          const isMe = p.id === mePlayerId;
          const pos = isMe
            ? positionRef.current
            : remotePositions.get(p.id) ?? { x: p.posX, y: p.posY, facing: p.facing };

          return (
            <div
              key={p.id}
              className="absolute transition-transform duration-75 ease-linear will-change-transform"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -100%)',
                zIndex: isMe ? 30 : 25,
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <span
                  className={
                    'type text-[13px] md:text-[15px] uppercase tracking-[0.15em] ' +
                    'px-2.5 py-1 whitespace-nowrap ' +
                    (p.ready
                      ? 'bg-green-700/95 text-paper border border-green-400/70'
                      : isMe
                        ? 'bg-blood/95 text-paper'
                        : 'bg-ink/85 text-bone border border-bone/25')
                  }
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                >
                  {p.displayName}
                  {isMe && ' (вы)'}
                </span>

                <FigureImage
                  code={p.avatarKey}
                  alt={p.displayName}
                  className="w-40 h-40 md:w-52 md:h-52
                             drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]"
                />
              </div>
            </div>
          );
        })}

      {wardrobeOpen && mePlayerId && (
        <FigureModal
          players={players}
          mePlayerId={mePlayerId}
          onPick={handlePick}
          onClose={() => setWardrobeOpen(false)}
          busy={pickingBusy}
        />
      )}
    </div>
  );
}

/* ============================================================
   Утилиты
   ============================================================ */

function innerBox(obj: LayoutObject) {
  const x1 = obj.x + (obj.w * obj.inset.left) / 100;
  const y1 = obj.y + (obj.h * obj.inset.top) / 100;
  const x2 = obj.x + obj.w - (obj.w * obj.inset.right) / 100;
  const y2 = obj.y + obj.h - (obj.h * obj.inset.bottom) / 100;
  return { x1, y1, x2, y2 };
}

function pushOutOfInner(x: number, y: number, obj: LayoutObject, safety: number) {
  const { x1, y1, x2, y2 } = innerBox(obj);

  const sx1 = x1 - safety;
  const sy1 = y1 - safety;
  const sx2 = x2 + safety;
  const sy2 = y2 + safety;

  if (x <= sx1 || x >= sx2 || y <= sy1 || y >= sy2) return { x, y };

  const dLeft = Math.abs(x - sx1);
  const dRight = Math.abs(sx2 - x);
  const dTop = Math.abs(y - sy1);
  const dBottom = Math.abs(sy2 - y);
  const min = Math.min(dLeft, dRight, dTop, dBottom);

  if (min === dLeft) return { x: sx1 - 0.1, y };
  if (min === dRight) return { x: sx2 + 0.1, y };
  if (min === dTop) return { x, y: sy1 - 0.1 };
  return { x, y: sy2 + 0.1 };
}