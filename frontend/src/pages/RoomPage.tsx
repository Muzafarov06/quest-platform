import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getSessionByCode,
  getSessionPlayers,
  joinSession,
  changeAvatar,
  setReady,
} from '../api/sessions';
import { getCase } from '../api/cases';
import { useAuth } from '../auth/useAuth';
import { useSessionSocket } from '../hooks/useSessionSocket';
import { useOrientation } from '../hooks/useOrientation';
import { useFullscreen } from '../hooks/useFullscreen';
import { LobbyRoom } from '../components/LobbyRoom';
import { RotateOverlay } from '../components/RotateOverlay';
import type { GameSession, SessionPlayer, Facing } from '../types/session';
import type { Case } from '../types/case';
import type { ApiErrorResponse } from '../types/api';

export function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isPortrait, isMobile } = useOrientation();
  const { exitFullscreen } = useFullscreen();

  const [session, setSession] = useState<GameSession | null>(null);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isReadyBusy, setIsReadyBusy] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const joinAttemptedRef = useRef(false);

  const [remotePositions, setRemotePositions] = useState<
    Map<string, { x: number; y: number; facing: Facing }>
  >(new Map());

  useEffect(() => {
    return () => {
      exitFullscreen();
    };
  }, [exitFullscreen]);

  const loadData = useCallback(async () => {
    if (!roomCode) return;
    try {
      const s = await getSessionByCode(roomCode);
      setSession(s);
      const p = await getSessionPlayers(s.id);
      setPlayers(p);
      if (!caseData) {
        getCase(s.caseId).then(setCaseData).catch(() => {});
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Комната не найдена.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  useEffect(() => {
    setIsLoading(true);
    loadData().finally(() => setIsLoading(false));
  }, [loadData]);

  /* Авто-вход: если пользователь ещё не активный игрок этой сессии — джойнимся. */
  useEffect(() => {
    if (!session || !players || !user) return;
    if (joinAttemptedRef.current) return;

    const me = players.find((p) => p.userId === user.id);
    if (me && me.active) return; // уже в игре

    if (session.status === 'FINISHED' || session.status === 'ABANDONED') {
      setError('Это расследование уже завершено.');
      return;
    }

    joinAttemptedRef.current = true;
    setIsJoining(true);

    joinSession(session.roomCode, { displayName: user.displayName })
      .then(() => loadData())
      .catch((err: unknown) => {
        const apiError = err as { response?: { data?: ApiErrorResponse } };
        setError(
          apiError.response?.data?.message ?? 'Не удалось войти в комнату.'
        );
      })
      .finally(() => setIsJoining(false));
  }, [session, players, user, loadData]);

  useSessionSocket(
    session?.id ?? null,
    (event) => {
      if (event.type === 'SESSION_STARTED' && session) {
        navigate(`/sessions/${session.id}/play`);
      }
      if (event.type === 'SESSION_CLOSED') {
        alert(
          event.reason
            ? `Сессия закрыта: ${event.reason}`
            : 'Владелец закрыл сессию для всех.'
        );
        navigate('/my-sessions');
        return;
      }
      if (event.type === 'PLAYER_JOINED' || event.type === 'PLAYER_LEFT') {
        loadData();
      }
      if (event.type === 'PLAYER_UPDATED') {
        loadData();
      }
      if (event.type === 'PLAYER_MOVED') {
        setRemotePositions((prev) => {
          const next = new Map(prev);
          next.set(event.playerId, {
            x: event.x,
            y: event.y,
            facing: event.facing,
          });
          return next;
        });
      }
    },
    !!session
  );

  /**
   * Если сессия уже ACTIVE и я в ней — перекинуть в игру.
   *
   * Покрывает случаи:
   *   • игрок подключился позже — сессия уже идёт;
   *   • владелец запустил игру, пока игрок был в лобби — приходит
   *     SESSION_STARTED, но здесь мы ещё раз страхуемся;
   *   • игрок зашёл по ссылке в комнату, где игра уже началась.
   */
  useEffect(() => {
    if (!session || !players) return;
    if (session.status !== 'ACTIVE') return;

    const mePlayer = players.find((p) => p.userId === user?.id);
    if (!mePlayer) return;

    navigate(`/sessions/${session.id}/play`, { replace: true });
  }, [session, players, user?.id, navigate]);

  const handleLocalPosition = useCallback(
    (x: number, y: number, facing: Facing) => {
      const meId = players?.find((p) => p.userId === user?.id)?.id;
      if (!meId) return;
      setRemotePositions((prev) => {
        const existing = prev.get(meId);
        if (
          existing &&
          existing.x === x &&
          existing.y === y &&
          existing.facing === facing
        ) {
          return prev;
        }
        const next = new Map(prev);
        next.set(meId, { x, y, facing });
        return next;
      });
    },
    [players, user?.id]
  );

  const copyToClipboard = async (text: string, kind: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      if (kind === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 1500);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 1500);
      }
    } catch {
      // ignore
    }
  };

  const handlePickFigure = useCallback(
    async (code: string) => {
      if (!session) return;
      try {
        await changeAvatar(session.id, code);
        await loadData();
      } catch (err: unknown) {
        const apiError = err as { response?: { data?: ApiErrorResponse } };
        alert(apiError.response?.data?.message ?? 'Не удалось сменить фигурку');
      }
    },
    [session, loadData]
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-40 bg-ink flex items-center justify-center">
        <span className="type text-[13px] uppercase tracking-[0.32em] text-bone-muted">
          Открываем комнату…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-40 bg-ink flex items-center justify-center p-6">
        <div className="paper paper-fresh p-8 max-w-lg w-full border-l-4 border-blood">
          <div className="type text-[11px] uppercase tracking-[0.28em] text-blood mb-3">
            Ошибка
          </div>
          <div className="text-ink-text text-base mb-6">{error}</div>
          <Link
            to="/my-sessions"
            className="type text-[12px] uppercase tracking-[0.24em]
                       text-blood hover:text-blood-hover"
          >
            ← Мои сессии
          </Link>
        </div>
      </div>
    );
  }

  if (!session || !players) {
    return (
      <div className="fixed inset-0 z-40 bg-ink flex items-center justify-center">
        <span className="type text-[13px] uppercase tracking-[0.32em] text-bone-muted">
          Подготовка комнаты…
        </span>
      </div>
    );
  }

  const inviteUrl = `${window.location.origin}/rooms/${session.roomCode}`;
  const mePlayer = players.find((p) => p.userId === user?.id) ?? null;
  const amIPlayer = !!mePlayer;

  /* Пока идёт авто-джойн или пользователь ещё не в списке — заглушка. */
  if (!amIPlayer) {
    return (
      <div className="fixed inset-0 z-40 bg-ink flex items-center justify-center">
        <span className="type text-[13px] uppercase tracking-[0.32em] text-bone-muted">
          {isJoining ? 'Входим в комнату…' : 'Подключаемся…'}
        </span>
      </div>
    );
  }

  const showRotateOverlay = isMobile && isPortrait && amIPlayer;

  const maxPlayers = caseData?.maxPlayers ?? 0;
  const playerCountLabel =
    maxPlayers > 0 ? `${players.length} / ${maxPlayers}` : `${players.length}`;

  const handleToggleReady = async () => {
    if (!session || !mePlayer) return;
    setIsReadyBusy(true);
    try {
      await setReady(session.id, !mePlayer.ready);
      await loadData();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      alert(apiError.response?.data?.message ?? 'Не удалось изменить готовность');
    } finally {
      setIsReadyBusy(false);
    }
  };

  return (
    <>
      {showRotateOverlay && <RotateOverlay />}

      <div className="fixed inset-0 z-40 bg-ink overflow-hidden">

        <div className="absolute inset-0">
          <LobbyRoom
            sessionId={session.id}
            players={players}
            mePlayerId={mePlayer.id}
            remotePositions={remotePositions}
            onLocalPosition={handleLocalPosition}
            onToggleReady={handleToggleReady}
            isMeReady={mePlayer.ready}
            isReadyBusy={isReadyBusy}
            onPickFigure={handlePickFigure}
            fill
          />
        </div>

        {/* Плашка дела */}
        {caseData && (
          <div className="absolute top-0 inset-x-0 p-3 sm:p-5 flex justify-center pointer-events-none z-[60]">
            <div
              className="pointer-events-auto px-6 sm:px-10 py-3 sm:py-4
                         border-2 border-brass/50 bg-ink/90 backdrop-blur-sm
                         max-w-[95vw]"
              style={{
                boxShadow:
                  'inset 0 1px 0 rgba(201,162,74,0.2), ' +
                  'inset 0 0 0 1px rgba(0,0,0,0.5), ' +
                  '0 14px 40px rgba(0,0,0,0.8), ' +
                  '0 0 30px rgba(201,162,74,0.08)',
              }}
            >
              <div className="flex items-baseline justify-center gap-3 sm:gap-5 flex-wrap">
                <span className="type text-[12px] sm:text-[14px] uppercase tracking-[0.36em] text-brass">
                  {caseData.code}
                </span>
                <span className="hidden sm:block w-px h-5 bg-brass/40" />
                <span className="font-poster text-xl sm:text-3xl md:text-[32px]
                                 uppercase tracking-[0.1em] text-bone leading-none">
                  {caseData.title}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Нижний HUD */}
        <div className="absolute bottom-0 inset-x-0 p-3 sm:p-6 pointer-events-none z-[60]">
          <div className="mx-auto max-w-[1280px] pointer-events-auto">
            <div
              className="relative flex items-stretch flex-wrap
                         border border-brass/40 bg-ink/85 backdrop-blur-sm
                         divide-x divide-brass/25"
              style={{
                boxShadow:
                  'inset 0 1px 0 rgba(201,162,74,0.14), ' +
                  '0 14px 46px rgba(0,0,0,0.75)',
              }}
            >
              <Corner pos="tl" />
              <Corner pos="tr" />
              <Corner pos="bl" />
              <Corner pos="br" />

              <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-7 py-3 sm:py-4">
                <PeopleIcon />
                <div className="flex flex-col leading-tight">
                  <span className="type text-[11px] sm:text-[13px] uppercase tracking-[0.28em] text-brass">
                    В комнате
                  </span>
                  <span className="font-poster text-2xl sm:text-3xl text-bone tracking-wide">
                    {playerCountLabel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-7 py-3 sm:py-4">
                <KeyIcon />
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="type text-[11px] sm:text-[13px] uppercase tracking-[0.28em] text-brass">
                    Код комнаты
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="font-mono text-lg sm:text-xl text-bone tracking-[0.24em]">
                      {session.roomCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(session.roomCode, 'code')}
                      title="Скопировать код"
                      className="text-brass/70 hover:text-brass transition-colors cursor-pointer"
                    >
                      <CopyIcon />
                    </button>
                    {copiedCode && (
                      <span className="type text-[11px] uppercase tracking-[0.22em] text-brass">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-4 px-5 sm:px-7 py-4 flex-1 min-w-0">
                <LinkIcon />
                <div className="flex flex-col leading-tight min-w-0 flex-1">
                  <span className="type text-[11px] sm:text-[13px] uppercase tracking-[0.28em] text-brass">
                    Ссылка на комнату
                  </span>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[15px] text-bone truncate">
                      {inviteUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inviteUrl, 'link')}
                      title="Скопировать ссылку"
                      className="text-brass/70 hover:text-brass transition-colors cursor-pointer shrink-0"
                    >
                      <CopyIcon />
                    </button>
                    {copiedLink && (
                      <span className="type text-[11px] uppercase tracking-[0.22em] text-brass shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Link
                to="/my-sessions"
                className="flex items-center gap-2 sm:gap-3 px-4 sm:px-7 py-3 sm:py-4
                           type text-[13px] sm:text-[15px] uppercase tracking-[0.28em]
                           text-bone hover:text-brass hover:bg-brass/5
                           transition-colors shrink-0 ml-auto"
              >
                <ExitIcon />
                <span>Выйти</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

/* ============================================================
   Иконки
   ============================================================ */

function PeopleIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.4"
         className="text-brass shrink-0">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="8.5" r="2.4" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M15.5 14.5c2.5.3 4.5 2.4 4.5 5.5" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.4"
         className="text-brass shrink-0">
      <circle cx="8" cy="12" r="3.5" />
      <path d="M11.5 12H21M18 12v4M15 12v3" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.4"
         className="text-brass shrink-0">
      <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6">
      <rect x="9" y="9" width="11" height="11" rx="1" />
      <path d="M5 15V5a1 1 0 0 1 1-1h10" />
    </svg>
  );
}

function ExitIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6"
         className="shrink-0">
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 12H3" />
      <path d="M7 8l-4 4 4 4" />
    </svg>
  );
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 12;
  const style: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    borderColor: 'rgba(201,162,74,0.85)',
  };
  if (pos === 'tl') { style.top = -1; style.left = -1; style.borderTopWidth = 2; style.borderLeftWidth = 2; }
  else if (pos === 'tr') { style.top = -1; style.right = -1; style.borderTopWidth = 2; style.borderRightWidth = 2; }
  else if (pos === 'bl') { style.bottom = -1; style.left = -1; style.borderBottomWidth = 2; style.borderLeftWidth = 2; }
  else { style.bottom = -1; style.right = -1; style.borderBottomWidth = 2; style.borderRightWidth = 2; }
  return <span style={style} />;
}``