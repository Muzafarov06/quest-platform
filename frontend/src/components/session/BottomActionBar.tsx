import type { ComponentType, SVGProps } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  sessionId: string;
  inventoryCount: number;
  menuOpen: boolean;
  onOpenInventory: () => void;
  onToggleMenu: () => void;
  /** Открыть панель диспетчерских звонков. */
  onOpenDispatch: () => void;
  /** Сколько непрочитанных звонков — рисуется бейджем. */
  dispatchUnreadCount: number;
}

/**
 * Нижняя панель действий в стиле детективной доски.
 *
 * Четыре кнопки по центру: Доска · Портфель · Звонок · Меню.
 * Все иконки — контурные SVG в латунном цвете.
 */
export function BottomActionBar({
  sessionId,
  inventoryCount,
  menuOpen,
  onOpenInventory,
  onToggleMenu,
  onOpenDispatch,
  dispatchUnreadCount,
}: Props) {
  return (
    <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-[90] pointer-events-none">
      <div
        className="relative pointer-events-auto flex items-stretch
                   border-2 border-brass/50 bg-ink/90 backdrop-blur-sm"
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(201,162,74,0.22), ' +
            'inset 0 0 0 1px rgba(0,0,0,0.6), ' +
            '0 14px 44px rgba(0,0,0,0.9), ' +
            '0 0 32px rgba(201,162,74,0.08)',
        }}
      >
        <Corner pos="tl" />
        <Corner pos="tr" />
        <Corner pos="bl" />
        <Corner pos="br" />

        {/* ─────────── Доска ─────────── */}
        <Link
          to={`/sessions/${sessionId}/board`}
          className="group flex flex-col items-center justify-center gap-1.5
                     px-3 sm:px-6 py-2.5 sm:py-3
                     transition-colors hover:bg-brass/10 cursor-pointer"
        >
          <BoardIcon className="w-6 h-6 sm:w-7 sm:h-7 text-brass/85 transition-all duration-200
                                group-hover:text-brass group-hover:drop-shadow-[0_0_8px_rgba(201,162,74,0.7)]" />
          <span
            className="type text-[9px] sm:text-[10px] uppercase tracking-[0.28em]
                       text-bone-muted transition-colors group-hover:text-bone"
          >
            Доска
          </span>
        </Link>

        <Divider />

        {/* ─────────── Портфель ─────────── */}
        <button
          type="button"
          onClick={onOpenInventory}
          className="group relative flex flex-col items-center justify-center gap-1.5
                     px-3 sm:px-6 py-2.5 sm:py-3
                     transition-colors hover:bg-brass/10 cursor-pointer"
        >
          <BagIcon className="w-6 h-6 sm:w-7 sm:h-7 text-brass/85 transition-all duration-200
                              group-hover:text-brass group-hover:drop-shadow-[0_0_8px_rgba(201,162,74,0.7)]" />
          <span
            className="type text-[9px] sm:text-[10px] uppercase tracking-[0.28em]
                       text-bone-muted transition-colors group-hover:text-bone"
          >
            Портфель
          </span>
          {inventoryCount > 0 && (
            <span
              className="absolute top-1 right-1 sm:right-2 min-w-[16px] h-[16px]
                         px-1 flex items-center justify-center
                         bg-blood text-paper
                         type text-[9px] leading-none rounded-full
                         tabular-nums pointer-events-none"
              style={{
                boxShadow:
                  '0 0 8px rgba(156,28,28,0.8), 0 1px 3px rgba(0,0,0,0.9)',
              }}
            >
              {inventoryCount}
            </span>
          )}
        </button>

        <Divider />

        {/* ─────────── Звонок ─────────── */}
        <button
          type="button"
          onClick={onOpenDispatch}
          className="group relative flex flex-col items-center justify-center gap-1.5
                     px-3 sm:px-6 py-2.5 sm:py-3
                     transition-colors hover:bg-brass/10 cursor-pointer"
        >
          <PhoneIcon className="w-6 h-6 sm:w-7 sm:h-7 text-brass/85 transition-all duration-200
                                group-hover:text-brass group-hover:drop-shadow-[0_0_8px_rgba(201,162,74,0.7)]" />
          <span
            className="type text-[9px] sm:text-[10px] uppercase tracking-[0.28em]
                       text-bone-muted transition-colors group-hover:text-bone"
          >
            Звонок
          </span>
          {dispatchUnreadCount > 0 && (
            <span
              className="absolute top-1 right-1 sm:right-2 min-w-[16px] h-[16px]
                         px-1 flex items-center justify-center
                         bg-blood text-paper
                         type text-[9px] leading-none rounded-full
                         tabular-nums pointer-events-none"
              style={{
                boxShadow:
                  '0 0 8px rgba(156,28,28,0.85), 0 1px 3px rgba(0,0,0,0.9)',
              }}
            >
              {dispatchUnreadCount}
            </span>
          )}
        </button>

        <Divider />

        {/* ─────────── Меню ─────────── */}
        <button
          type="button"
          onClick={onToggleMenu}
          className={
            'group flex flex-col items-center justify-center gap-1.5 ' +
            'px-3 sm:px-6 py-2.5 sm:py-3 ' +
            'transition-colors cursor-pointer ' +
            (menuOpen ? 'bg-brass/15 ' : 'hover:bg-brass/10')
          }
        >
          <MenuIcon
            className={
              'w-6 h-6 sm:w-7 sm:h-7 transition-all duration-200 ' +
              (menuOpen
                ? 'text-brass drop-shadow-[0_0_10px_rgba(201,162,74,0.9)]'
                : 'text-brass/85 group-hover:text-brass group-hover:drop-shadow-[0_0_8px_rgba(201,162,74,0.7)]')
            }
          />
          <span
            className={
              'type text-[9px] sm:text-[10px] uppercase tracking-[0.28em] ' +
              'transition-colors ' +
              (menuOpen ? 'text-bone' : 'text-bone-muted group-hover:text-bone')
            }
          >
            Меню
          </span>
        </button>
      </div>
    </div>
  );
}

/* ============================================================ */

function Divider() {
  return (
    <span
      aria-hidden="true"
      className="w-px self-stretch my-2
                 bg-gradient-to-b from-transparent via-brass/40 to-transparent"
    />
  );
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 8;
  const style: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    borderColor: 'rgba(201,162,74,0.9)',
    pointerEvents: 'none',
  };
  if (pos === 'tl') {
    style.top = -1; style.left = -1;
    style.borderTopWidth = 1.5; style.borderLeftWidth = 1.5;
  } else if (pos === 'tr') {
    style.top = -1; style.right = -1;
    style.borderTopWidth = 1.5; style.borderRightWidth = 1.5;
  } else if (pos === 'bl') {
    style.bottom = -1; style.left = -1;
    style.borderBottomWidth = 1.5; style.borderLeftWidth = 1.5;
  } else {
    style.bottom = -1; style.right = -1;
    style.borderBottomWidth = 1.5; style.borderRightWidth = 1.5;
  }
  return <span style={style} />;
}

/* ============================================================
   Иконки
   ============================================================ */

type IconProps = SVGProps<SVGSVGElement>;

function BoardIcon({ className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <rect x="2.5" y="5" width="19" height="14" rx="0.6" />
      <rect x="5.2" y="8" width="5" height="3.6" rx="0.3" />
      <rect x="13.8" y="8" width="5" height="3.6" rx="0.3" />
      <rect x="8.8" y="14" width="6.4" height="3.6" rx="0.3" />
      <line x1="10.2" y1="10" x2="9.2" y2="14" />
      <line x1="13.8" y1="10" x2="14.8" y2="14" />
      <line x1="6.5" y1="5" x2="6.5" y2="7.2" />
      <line x1="17.5" y1="5" x2="17.5" y2="7.2" />
    </svg>
  );
}

function BagIcon({ className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d="M9 7 V5.5 a2 2 0 0 1 2 -2 h2 a2 2 0 0 1 2 2 V7" />
      <rect x="3" y="7" width="18" height="13" rx="1" />
      <line x1="3" y1="13.6" x2="21" y2="13.6" />
      <rect x="10.6" y="12.1" width="2.8" height="3" rx="0.3" />
    </svg>
  );
}

function PhoneIcon({ className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d="M5 4 h4 l2 5 -2.5 1.5 a11 11 0 0 0 5 5 L15 13 l5 2 v4 a2 2 0 0 1 -2 2 A16 16 0 0 1 3 6 a2 2 0 0 1 2 -2 Z" />
    </svg>
  );
}

function MenuIcon({ className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <line x1="3.5" y1="7" x2="20.5" y2="7" />
      <line x1="3.5" y1="12" x2="16.5" y2="12" />
      <line x1="3.5" y1="17" x2="13" y2="17" />
    </svg>
  );
}

export type { ComponentType };