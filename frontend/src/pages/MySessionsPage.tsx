import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getMySessions,
  getSessionPlayers,
  getSessionByCode,
  deleteSession,
} from '../api/sessions';
import { getCase } from '../api/cases';
import { Container } from '../components/layout/Container';
import { useAuth } from '../auth/useAuth';
import type { GameSession, SessionStatus } from '../types/session';
import type { ApiErrorResponse } from '../types/api';

interface EnrichedSession {
  session: GameSession;
  caseTitle: string | null;
  caseCode: string | null;
  caseGenre: string | null;
  playerCount: number;
}

const STATUS_LABEL: Record<SessionStatus, string> = {
  LOBBY: 'Лобби',
  ACTIVE: 'Идёт игра',
  FINISHED: 'Завершено',
  ABANDONED: 'Брошено',
};

const STATUS_CLASS: Record<SessionStatus, string> = {
  LOBBY: 'bg-brass/15 text-brass border-brass/40',
  ACTIVE: 'bg-green-700/20 text-green-300 border-green-600/50',
  FINISHED: 'bg-bone/10 text-bone-muted border-bone/25',
  ABANDONED: 'bg-blood/15 text-blood border-blood/50',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(startedAt: string | null, finishedAt: string | null): string | null {
  if (!startedAt || !finishedAt) return null;
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms <= 0) return null;
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin} мин`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

function getTarget(s: GameSession): string {
  if (s.status === 'LOBBY') return `/rooms/${s.roomCode}`;
  return `/sessions/${s.id}/play`;
}

function getActionLabel(s: GameSession): string {
  switch (s.status) {
    case 'LOBBY':    return 'Войти в лобби';
    case 'ACTIVE':   return 'Вернуться в игру';
    case 'FINISHED': return 'Открыть дело';
    case 'ABANDONED':return 'Посмотреть';
  }
}

/** Достаёт код комнаты из строки (чистый код, ссылка, ссылка с хвостом). */
function extractRoomCode(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const m = trimmed.match(/\/rooms\/([A-Z0-9]+)/i);
  if (m) return m[1].toUpperCase();

  if (/^[A-Z0-9]{4,10}$/i.test(trimmed)) return trimmed.toUpperCase();

  return null;
}

export function MySessionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState<EnrichedSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* Форма «Войти по коду». */
  const [joinInput, setJoinInput] = useState('');
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const reload = async () => {
    setError(null);
    try {
      const sessions = await getMySessions();

      const enriched = await Promise.all(
        sessions.map(async (s): Promise<EnrichedSession> => {
          const [caseData, players] = await Promise.all([
            getCase(s.caseId).catch(() => null),
            getSessionPlayers(s.id).catch(() => []),
          ]);
          return {
            session: s,
            caseTitle: caseData?.title ?? null,
            caseCode: caseData?.code ?? null,
            caseGenre: caseData?.genre ?? null,
            playerCount: players.filter((p) => p.active).length,
          };
        })
      );

      setItems(enriched);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось загрузить сессии.');
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const handleDelete = async (session: GameSession) => {
    if (!confirm(`Удалить сессию ${session.roomCode}? Действие необратимо.`)) return;

    setDeletingId(session.id);
    try {
      await deleteSession(session.id);
      await reload();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      alert(apiError.response?.data?.message ?? 'Не удалось удалить сессию');
    } finally {
      setDeletingId(null);
    }
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    const code = extractRoomCode(joinInput);
    if (!code) {
      setJoinError('Введите код комнаты или ссылку вида …/rooms/ABC123');
      return;
    }

    setJoinBusy(true);
    try {
      const session = await getSessionByCode(code);
      navigate(`/rooms/${session.roomCode}`);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setJoinError(
        apiError.response?.data?.message
          ?? 'Комната не найдена. Проверьте код или ссылку.'
      );
      setJoinBusy(false);
    }
  };

  return (
    <Container>
      <section className="py-10 md:py-14">

        <div className="mb-10 md:mb-14 max-w-3xl">
          <span className="kicker">Личный архив</span>

          <h1 className="mt-6 text-[clamp(2.5rem,6vw,5rem)] leading-[0.9]">
            <span className="text-texture-bone">Мои </span>
            <span className="text-texture-blood">расследования</span>
          </h1>

          <p className="mt-6 text-bone-muted text-base md:text-lg leading-relaxed max-w-xl">
            Здесь хранится каждое начатое дело — недокрученные версии,
            непройденные допросы, отложенные гипотезы.
          </p>
        </div>

        {/* ─── Форма входа по коду / ссылке ─── */}
        <div className="relative max-w-3xl mb-12 md:mb-16">
          <div className="pin brass" style={{ top: -8, left: 44, zIndex: 20 }} />

          <form
            onSubmit={handleJoin}
            className="paper paper-fresh p-6 md:p-8 relative"
          >
            <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
              <span className="stamp-red text-xs">Приглашение</span>
            </div>

            <div className="flex items-baseline justify-between pb-3 mb-5
                            border-b border-dashed border-ink-text/25">
              <span className="type text-[11px] uppercase tracking-[0.28em]
                               text-ink-text-soft">
                Войти в чужое расследование
              </span>
            </div>

            <div className="hand text-xl md:text-2xl text-blood rotate-[-1deg] mb-5">
              вставьте код или ссылку от напарника
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={joinInput}
                onChange={(e) => {
                  setJoinInput(e.target.value);
                  setJoinError(null);
                }}
                placeholder="ABC123 или https://…/rooms/ABC123"
                maxLength={300}
                autoComplete="off"
                spellCheck={false}
                className="flex-1 bg-transparent border-b-2 border-ink-text/40
                           text-ink-text font-type text-lg
                           placeholder:text-ink-text-dim/60 placeholder:italic
                           px-0 py-2 focus:outline-none focus:border-blood
                           transition-colors"
              />

              <button
                type="submit"
                disabled={joinBusy || !joinInput.trim()}
                className="bg-blood text-paper px-6 py-3
                           type text-[12px] uppercase tracking-[0.26em]
                           hover:bg-blood-hover transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed
                           cursor-pointer whitespace-nowrap"
              >
                {joinBusy ? 'Ищем…' : 'Войти →'}
              </button>
            </div>

            {joinError && (
              <div className="mt-4 px-4 py-3 bg-blood/15 border-l-4 border-blood
                              type text-[13px] text-blood">
                {joinError}
              </div>
            )}
          </form>
        </div>

        {error && (
          <div className="paper paper-fresh p-6 max-w-2xl border-l-4 border-blood">
            <div className="type text-[12px] uppercase tracking-[0.28em] text-blood mb-2">
              Ошибка
            </div>
            <div className="text-ink-text text-base">{error}</div>
          </div>
        )}

        {items === null && !error && (
          <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted">
            Поднимаем архив…
          </div>
        )}

        {items && items.length === 0 && (
          <div className="paper paper-fresh p-8 md:p-10 max-w-2xl relative">
            <div className="pin brass" style={{ top: -6, left: 32 }} />

            <div className="type text-[12px] uppercase tracking-[0.28em] text-ink-text-dim mb-3">
              Архив пуст
            </div>

            <div className="text-ink-text text-lg md:text-xl leading-relaxed mb-6">
              Вы ещё не начинали ни одного расследования.
              Откройте каталог или присоединитесь по коду.
            </div>

            <Link
              to="/cases"
              className="inline-flex items-center gap-2
                         type text-[13px] uppercase tracking-[0.24em]
                         text-blood hover:text-blood-hover
                         underline underline-offset-4 decoration-dotted
                         transition-colors"
            >
              Открыть каталог дел →
            </Link>
          </div>
        )}

        {items && items.length > 0 && (
          <>
            <div className="mb-6 flex items-baseline gap-3">
              <span className="type text-[11px] uppercase tracking-[0.28em] text-bone-muted">
                Ваши сессии
              </span>
              <span className="w-px h-4 bg-bone/20" />
              <span className="type text-[13px] text-bone">
                {items.length}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {items.map((item) => (
                <SessionCard
                  key={item.session.id}
                  item={item}
                  isOwner={item.session.ownerUserId === user?.id}
                  isDeleting={deletingId === item.session.id}
                  onDelete={() => handleDelete(item.session)}
                />
              ))}
            </div>
          </>
        )}

      </section>
    </Container>
  );
}

/* ============================================================ */

function SessionCard({
  item,
  isOwner,
  isDeleting,
  onDelete,
}: {
  item: EnrichedSession;
  isOwner: boolean;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  const { session: s } = item;
  const isClosed = s.status === 'FINISHED' || s.status === 'ABANDONED';
  const duration = formatDuration(s.startedAt, s.finishedAt);

  /* Удалять можно только свои и не-ACTIVE. */
  const canDelete = isOwner && s.status !== 'ACTIVE';

  return (
    <div className="relative group">
      <Link
        to={getTarget(s)}
        className={
          'block lift ' +
          (isClosed ? 'opacity-90 hover:opacity-100' : '')
        }
      >
        <article className="paper paper-old p-5 md:p-6 relative h-full flex flex-col">
          <div className="pin" style={{ top: -6, left: 28, zIndex: 20 }} />

          {item.caseCode && (
            <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
              <span className="stamp-red text-[12px]">{item.caseCode}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mb-5 pt-1 pr-10">
            <span
              className={
                'type text-[11px] uppercase tracking-[0.24em] ' +
                'px-3 py-1 border ' + STATUS_CLASS[s.status]
              }
            >
              {STATUS_LABEL[s.status]}
            </span>

            {s.isTest && (
              <span className="type text-[10px] uppercase tracking-[0.28em]
                               text-ink-text-dim border border-ink-text/30
                               px-2 py-0.5 rotate-[3deg]">
                Тест
              </span>
            )}

            <span className="font-mono text-[13px] tracking-[0.2em] text-ink-text-dim ml-auto">
              {s.roomCode}
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl text-ink-text leading-[0.95] mb-2
                         transition-colors group-hover:text-blood">
            {item.caseTitle ?? 'Неизвестное дело'}
          </h2>

          <div className="type text-[12px] uppercase tracking-[0.24em] text-ink-text-dim mb-5">
            {item.caseGenre ?? 'Расследование'}
          </div>

          <div className="space-y-2 mt-auto pt-4 border-t border-ink-text/20">
            <MetaRow label="Создана" value={formatDate(s.createdAt)} />

            {s.startedAt && (
              <MetaRow label="Начата" value={formatDate(s.startedAt)} />
            )}

            {duration && <MetaRow label="Длилась" value={duration} />}

            <MetaRow
              label="Игроков"
              value={item.playerCount > 0 ? String(item.playerCount) : '—'}
            />
          </div>

          <div className="mt-5 pt-4 flex items-center justify-between
                          border-t border-dashed border-ink-text/25">
            <span className="type text-[12px] uppercase tracking-[0.24em] text-ink-text-dim">
              Открыть папку
            </span>

            <span className="type text-[12px] uppercase tracking-[0.24em] text-blood
                             transition-colors
                             flex items-center gap-2">
              {getActionLabel(s)}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </span>
          </div>
        </article>
      </Link>

      {/* Кнопка удаления — только владельцу и только для не-ACTIVE. */}
      {canDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
          title="Удалить сессию"
          className="absolute top-2 right-2 z-20 w-9 h-9 flex items-center justify-center
                     bg-ink/90 border border-blood/60 text-blood
                     type text-[14px] leading-none
                     hover:bg-blood hover:text-paper
                     transition-colors cursor-pointer
                     disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }}
        >
          {isDeleting ? '…' : '✕'}
        </button>
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="type text-[12px] uppercase tracking-[0.24em] text-ink-text-dim">
        {label}
      </span>
      <span className="type text-[13px] text-ink-text text-right">
        {value}
      </span>
    </div>
  );
}