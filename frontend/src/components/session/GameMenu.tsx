import { useEffect, useState } from 'react';
import { FigureImage } from '../FigureImage';
import { kickPlayer } from '../../api/sessions';
import type { SessionPlayer } from '../../types/session';

interface Props {
  open: boolean;
  onToggle: () => void;
  sessionId: string;
  roomCode: string;
  players: SessionPlayer[];
  mePlayerId: string | null;
  isOwner: boolean;
  caseTitle: string;
  caseCode: string;
  onLeave: () => void;
  onCloseSession: () => void;
  /** Владелец нажал «Дать финальный ответ». */
  onStartFinalAnswer: () => void;
  onOpenVoice: () => void;
  hasFinalQuestion: boolean;
  onKicked: () => void;
}

export function GameMenu({
  open,
  onToggle,
  sessionId,
  roomCode,
  players,
  mePlayerId,
  isOwner,
  caseTitle,
  caseCode,
  onLeave,
  onCloseSession,
  onStartFinalAnswer,
  onOpenVoice,
  hasFinalQuestion,
  onKicked,
}: Props) {
  const [kickingId, setKickingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggle();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onToggle]);

  const activePlayers = players.filter((p) => p.active);

  const handleKick = async (p: SessionPlayer) => {
    if (!confirm(
      `Исключить ${p.displayName} из сессии?\n\n` +
      'Игрок вылетит сразу и больше не сможет вернуться.'
    )) return;

    setKickingId(p.id);
    try {
      await kickPlayer(sessionId, p.id);
      onKicked();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      alert(apiError.response?.data?.message ?? 'Не удалось исключить игрока');
    } finally {
      setKickingId(null);
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm
                     animate-fade-in"
          onClick={onToggle}
        />
      )}

      <aside
        className={
          'fixed top-0 right-0 bottom-0 z-[90] w-full sm:w-96 ' +
          'border-l-2 border-brass/40 bg-ink/95 backdrop-blur-md ' +
          'flex flex-col overflow-y-auto scroll-map ' +
          'transition-transform duration-300 ease-out'
        }
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: '-14px 0 46px rgba(0,0,0,0.85)',
        }}
      >
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-brass/30">
          <div>
            <div className="type text-[10px] uppercase tracking-[0.32em] text-brass mb-1">
              {caseCode}
            </div>
            <div className="font-poster text-lg text-bone leading-tight truncate">
              {caseTitle}
            </div>
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="w-9 h-9 flex items-center justify-center
                       text-bone-muted hover:text-blood type text-xl
                       transition-colors cursor-pointer shrink-0"
            aria-label="Закрыть меню"
          >
            ✕
          </button>
        </div>

        {/* Игроки */}
        <div className="px-5 py-4 border-b border-brass/20">
          <div className="type text-[10px] uppercase tracking-[0.3em] text-brass mb-3">
            В деле · {activePlayers.length}
          </div>
          <ul className="space-y-2">
            {activePlayers.map((p) => {
              const isMe = p.id === mePlayerId;
              const canKick = isOwner && !isMe;
              const isKicking = kickingId === p.id;
              return (
                <li key={p.id} className="flex items-center gap-3 py-1">
                  <FigureImage
                    code={p.avatarKey}
                    alt={p.displayName}
                    className="w-10 h-10 shrink-0"
                  />
                  <span
                    className={
                      'type text-[13px] uppercase tracking-[0.16em] truncate flex-1 ' +
                      (isMe ? 'text-blood' : 'text-bone')
                    }
                  >
                    {p.displayName}
                    {isMe && ' (вы)'}
                  </span>

                  {p.ready && (
                    <span className="type text-[10px] uppercase tracking-[0.2em] text-green-400">
                      ✓
                    </span>
                  )}

                  {canKick && (
                    <button
                      type="button"
                      onClick={() => handleKick(p)}
                      disabled={isKicking}
                      title="Исключить игрока"
                      className="shrink-0 px-2 py-1 border border-blood/50 text-blood
                                 type text-[9px] uppercase tracking-[0.2em]
                                 hover:bg-blood hover:text-paper
                                 transition-colors cursor-pointer
                                 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isKicking ? '…' : 'Искл.'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Голос */}
        <div className="px-5 py-4 border-b border-brass/20">
          <div className="type text-[10px] uppercase tracking-[0.3em] text-brass mb-3">
            Связь
          </div>
          <MenuButton
            onClick={() => {
              onOpenVoice();
              onToggle();
            }}
            icon={<VoiceIcon />}
            label="Голосовая связь"
          />
        </div>

        {/* Финал */}
        {hasFinalQuestion && (
          <div className="px-5 py-4 border-b border-brass/20">
            <div className="type text-[10px] uppercase tracking-[0.3em] text-blood mb-3">
              Финал
            </div>

            {isOwner ? (
              <button
                type="button"
                onClick={() => {
                  onStartFinalAnswer();
                  onToggle();
                }}
                className="w-full flex items-center gap-3 px-4 py-3
                           bg-blood text-paper border border-blood
                           type text-[12px] uppercase tracking-[0.24em]
                           hover:bg-blood-hover transition-colors cursor-pointer"
              >
                <FinalIcon className="w-5 h-5 shrink-0" />
                <span>Дать финальный ответ</span>
              </button>
            ) : (
              <div className="px-4 py-3 border border-brass/30 bg-brass/[0.06]
                              type text-[11px] uppercase tracking-[0.22em]
                              text-bone-muted leading-relaxed">
                Финальный ответ даёт владелец.
                <br />
                Модалка откроется автоматически.
              </div>
            )}
          </div>
        )}

        {/* Управление */}
        <div className="px-5 py-4 mt-auto border-t border-brass/20">
          <div className="type text-[10px] uppercase tracking-[0.3em] text-brass mb-3">
            Управление
          </div>

          <div className="flex flex-col gap-2">
            <MenuButton
              onClick={onLeave}
              icon={<DoorIcon />}
              label="Покинуть сессию"
              danger
            />
            {isOwner && (
              <MenuButton
                onClick={onCloseSession}
                icon={<CrossIcon />}
                label="Закрыть для всех"
                danger
              />
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-brass/15">
            <div className="type text-[10px] uppercase tracking-[0.28em] text-bone-dim mb-1">
              Код комнаты
            </div>
            <div className="font-mono text-base text-brass tracking-[0.24em]">
              {roomCode}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ============================================================ */

function MenuButton({
  onClick,
  icon,
  label,
  danger = false,
}: {
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  const cls =
    'w-full flex items-center gap-3 px-4 py-3 border ' +
    'type text-[12px] uppercase tracking-[0.22em] transition-colors cursor-pointer text-left ' +
    (danger
      ? 'border-blood/40 text-blood hover:bg-blood/10 '
      : 'border-brass/30 text-bone-muted hover:text-bone hover:border-brass/60 hover:bg-brass/5 ');

  return (
    <button type="button" onClick={onClick} className={cls}>
      <span className="shrink-0 w-5 h-5 flex items-center justify-center">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

/* ============================================================ */

function VoiceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
         className="w-5 h-5" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  );
}

function FinalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
         className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function DoorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
         className="w-5 h-5" aria-hidden="true">
      <path d="M4 20 V4 a1 1 0 0 1 1 -1 h11 a1 1 0 0 1 1 1 v16" />
      <line x1="3" y1="20" x2="21" y2="20" />
      <circle cx="14" cy="12" r="0.8" fill="currentColor" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round"
         className="w-5 h-5" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}