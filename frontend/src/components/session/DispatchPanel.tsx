import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { GameEvent } from '../../types/action';

export interface DispatchMessage {
  id: string;
  /** От кого пришёл звонок. */
  from: string;
  /** Тело сообщения. */
  body: string;
  /** ISO-строка, когда сообщение получено. */
  createdAt: string;
  read: boolean;
}

interface Props {
  open: boolean;
  messages: DispatchMessage[];
  onClose: () => void;
  onMarkAllRead: () => void;
}

/**
 * Панель диспетчерских звонков.
 *
 * Открывается из BottomActionBar. Стиль — пергаментная страница
 * с журналом вызовов, в духе детективной доски.
 */
export function DispatchPanel({
  open,
  messages,
  onClose,
  onMarkAllRead,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) onMarkAllRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center
                 p-4 md:p-8 overflow-y-auto animate-fade-in"
      style={{ background: 'rgba(8, 7, 5, 0.88)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-auto animate-rise-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="paper paper-old relative shadow-paper-lift">
          <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />
          <div className="pin brass" style={{ top: -8, right: 44, zIndex: 20 }} />

          <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
            <span className="stamp-red text-xs">Диспетчер</span>
          </div>

          {/* Заголовок */}
          <header className="relative px-6 sm:px-8 pt-7 pb-5">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="min-w-0">
                <span className="kicker text-[11px]">Линия связи · 555-0117</span>
                <h2 className="mt-3 font-poster text-3xl sm:text-4xl leading-[0.95] text-texture-ink">
                  Журнал вызовов
                </h2>
                <div className="mt-3 hand text-xl text-blood rotate-[-1.5deg]">
                  что успел передать штаб
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="hidden sm:flex items-start gap-5">
                  <Stat label="Вызовов" value={messages.length} accent />
                  <Stat
                    label="Новых"
                    value={messages.filter((m) => !m.read).length}
                  />
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="shrink-0 w-9 h-9 flex items-center justify-center
                             border border-ink-text/25 text-ink-text-soft
                             hover:text-blood hover:border-blood/50
                             transition-colors cursor-pointer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="w-4 h-4"
                  >
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* Разделитель */}
          <div className="relative px-6 sm:px-8 pb-4">
            <div className="border-b border-dashed border-ink-text/25" />
          </div>

          {/* Список сообщений */}
          <div className="relative px-6 sm:px-8 pb-8
                          min-h-[240px] max-h-[62vh] overflow-y-auto scroll-paper">
            {messages.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="flex flex-col gap-4 pt-2">
                {messages
                  .slice()
                  .reverse()
                  .map((m) => (
                    <DispatchEntry key={m.id} message={m} />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ============================================================ */

function DispatchEntry({ message }: { message: DispatchMessage }) {
  const t = new Date(message.createdAt);
  const timeStr = `${String(t.getHours()).padStart(2, '0')}:${String(
    t.getMinutes()
  ).padStart(2, '0')}`;
  const dateStr = t.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  });

  return (
    <div
      className="relative border-l-4 border-blood/70
                 bg-black/[0.05] px-4 py-3"
    >
      {/* Верхняя строка: время + отправитель */}
      <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
        <span
          className="type text-[12px] uppercase tracking-[0.22em] text-blood"
        >
          📞 {message.from}
        </span>
        <span
          className="type text-[11px] tabular-nums text-ink-text-dim"
          style={{ fontFamily: 'var(--font-type, monospace)' }}
        >
          {dateStr} · {timeStr}
        </span>
      </div>

      {/* Тело сообщения */}
      <div
        className="text-ink-text text-[14px] leading-relaxed whitespace-pre-line"
        style={{ fontFamily: 'var(--font-type, monospace)' }}
      >
        {message.body}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-end leading-none">
      <span className="type text-[9px] uppercase tracking-[0.26em] text-ink-text-dim">
        {label}
      </span>
      <span
        className={
          'font-poster text-3xl tabular-nums mt-1 ' +
          (accent ? 'text-blood' : 'text-ink-text')
        }
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div
        className="w-20 h-20 mb-5 flex items-center justify-center
                   border-2 border-dashed border-ink-text/25 text-ink-text-dim"
      >
        <PhoneIcon className="w-9 h-9" />
      </div>
      <div className="font-poster text-2xl text-ink-text mb-2">
        Эфир молчит
      </div>
      <p className="type text-[11px] uppercase tracking-[0.22em]
                    text-ink-text-dim max-w-sm leading-relaxed">
        Сообщения от штаба появятся здесь,<br />
        как только поступят новые данные
      </p>
    </div>
  );
}

/* ============================================================ */

export function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 4 h4 l2 5 -2.5 1.5 a11 11 0 0 0 5 5 L15 13 l5 2 v4 a2 2 0 0 1 -2 2 A16 16 0 0 1 3 6 a2 2 0 0 1 2 -2 Z" />
    </svg>
  );
}

/* ============================================================ */

/**
 * Преобразует GameEvent с типом DISPATCH_CALL в DispatchMessage.
 *
 * Если в начале текста есть «[Имя]», выносим это в поле from.
 * Иначе отправитель — «Диспетчер».
 */
export function gameEventToDispatch(ev: GameEvent): DispatchMessage {
  const raw = ev.message ?? '';
  const m = raw.match(/^\s*\[([^\]]+)\]\s*(.*)$/s);

  const from = m ? m[1].trim() : 'Диспетчер';
  const body = m ? m[2] : raw;

  return {
    id: ev.id,
    from,
    body,
    createdAt: new Date().toISOString(),
    read: false,
  };
}