import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { getMySessions } from '../api/sessions';
import { Container } from '../components/layout/Container';
import { FigureImage } from '../components/FigureImage';
import type { GameSession } from '../types/session';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProfilePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<GameSession[] | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  useEffect(() => {
    getMySessions()
      .then(setSessions)
      .catch(() => setSessionsError('Не удалось загрузить статистику.'));
  }, []);

  if (!user) return null;

  const isAdmin = user.roles?.includes('ADMIN');
  const statusLabel: Record<string, string> = {
    ACTIVE: 'Активен',
    BLOCKED: 'Заблокирован',
    DELETED: 'Удалён',
  };

  const totalSessions = sessions?.length ?? 0;
  const activeSessions = sessions?.filter((s) => s.status === 'ACTIVE').length ?? 0;
  const finishedSessions = sessions?.filter((s) => s.status === 'FINISHED').length ?? 0;
  const abandonedSessions = sessions?.filter((s) => s.status === 'ABANDONED').length ?? 0;

  return (
    <Container>
      <section className="py-10 md:py-16">

        {/* ─── Заголовок ─── */}
        <div className="mb-10 md:mb-14 max-w-3xl">
          <span className="kicker">Личное дело</span>

          <h1 className="mt-6 text-[clamp(2.5rem,6vw,5rem)] leading-[0.9]">
            <span className="text-texture-bone">Досье </span>
            <span className="text-texture-blood">агента</span>
          </h1>

          <div className="mt-6 hand text-2xl md:text-3xl rotate-[-1deg]">
            здесь хранится всё, что о вас известно штабу
          </div>
        </div>

        {/* ─── Основная сетка ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.6fr] gap-8 lg:gap-12 items-start">

          {/* ─── ЛЕВАЯ КОЛОНКА: карточка с аватаром ─── */}
          <div className="relative">
            <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />
            <div className="pin brass" style={{ top: -8, right: 44, zIndex: 20 }} />

            <div className="paper paper-old p-6 md:p-8 relative">
              <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
                <span className="stamp-red text-xs">Сов. секретно</span>
              </div>

              <div className="flex items-baseline justify-between pb-3 mb-6
                              border-b border-dashed border-ink-text/25">
                <span className="type text-[11px] uppercase tracking-[0.28em]
                                 text-ink-text-soft">
                  Опознавательная карточка
                </span>
              </div>

              {/* Аватар — фигурка или заглушка */}
              <div className="relative w-full aspect-square mb-6
                              flex items-center justify-center
                              bg-ink-card/70 border border-ink-text/15">
                <div className="photo-corner tl" />
                <div className="photo-corner tr" />
                <div className="photo-corner br" />
                <div className="photo-corner bl" />

                <FigureImage
                  code={user.avatarKey}
                  alt={user.displayName}
                  className="w-[70%] h-[70%] object-contain drop-shadow-strong"
                />
              </div>

              {/* Имя и email */}
              <div className="text-center mb-6">
                <div className="font-poster text-3xl md:text-4xl leading-tight
                                text-ink-text break-words">
                  {user.displayName}
                </div>
                <div className="type text-[11px] uppercase tracking-[0.28em]
                                text-ink-text-dim mt-2">
                  {user.email}
                </div>
              </div>

              {/* Печать ведомства */}
              <div className="flex justify-center mb-6">
                <span className="stamp-red text-[11px]">
                  {isAdmin ? 'Уровень · Администратор' : 'Уровень · Сотрудник'}
                </span>
              </div>

              {/* Метаданные карточки */}
              <div className="flex flex-col gap-2 pt-4 border-t
                              border-dashed border-ink-text/25">
                <Row label="ID агента" value={user.id.slice(0, 8).toUpperCase()} />
                <Row
                  label="Статус"
                  value={statusLabel[user.status] ?? user.status}
                />
                <Row label="Роли" value={
                  user.roles && user.roles.length > 0
                    ? user.roles.join(' · ')
                    : '—'
                } />
                <Row
                  label="В деле с"
                  value={formatDate(user.createdAt)}
                />
              </div>
            </div>
          </div>

          {/* ─── ПРАВАЯ КОЛОНКА: статистика + действия ─── */}
          <div className="flex flex-col gap-8">

            {/* Статистика */}
            <div className="relative">
              <div className="pin brass" style={{ top: -8, left: 44, zIndex: 20 }} />

              <div className="paper paper-fresh p-6 md:p-8 relative">
                <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
                  <span className="stamp-red text-xs">Сводка</span>
                </div>

                <div className="flex items-baseline justify-between pb-3 mb-6
                                border-b border-dashed border-ink-text/25">
                  <span className="type text-[11px] uppercase tracking-[0.28em]
                                   text-ink-text-soft">
                    Ваша практика
                  </span>
                </div>

                {sessions === null && !sessionsError && (
                  <div className="type text-[12px] uppercase tracking-[0.28em]
                                  text-ink-text-dim py-6 text-center">
                    Собираем данные…
                  </div>
                )}

                {sessionsError && (
                  <div className="px-4 py-3 bg-blood/15 border-l-4 border-blood
                                  type text-[13px] text-blood">
                    {sessionsError}
                  </div>
                )}

                {sessions !== null && (
                  <div className="grid grid-cols-2 gap-5">
                    <Stat
                      label="Всего расследований"
                      value={totalSessions}
                      accent
                    />
                    <Stat
                      label="В процессе"
                      value={activeSessions}
                    />
                    <Stat
                      label="Раскрыто"
                      value={finishedSessions}
                    />
                    <Stat
                      label="Брошено"
                      value={abandonedSessions}
                    />
                  </div>
                )}

                <p className="mt-6 type text-[11px] uppercase tracking-[0.24em]
                              text-ink-text-dim italic">
                  Учитываются все ваши сессии с момента регистрации.
                </p>
              </div>
            </div>

            {/* Действия */}
            <div className="relative">
              <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />

              <div className="paper paper-old p-6 md:p-8 relative">
                <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
                  <span className="stamp-red text-xs">Действия</span>
                </div>

                <div className="flex items-baseline justify-between pb-3 mb-6
                                border-b border-dashed border-ink-text/25">
                  <span className="type text-[11px] uppercase tracking-[0.28em]
                                   text-ink-text-soft">
                    Следующие шаги
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <ActionLink
                    to="/cases"
                    title="Открыть каталог дел"
                    hint="Найти новое расследование и собрать команду"
                    primary
                  />
                  <ActionLink
                    to="/my-sessions"
                    title="Мои расследования"
                    hint="Вернуться к активным или прошлым сессиям"
                  />
                  {isAdmin && (
                    <ActionLink
                      to="/admin"
                      title="Админ-панель"
                      hint="Управление кейсами, персонажами, фигурками"
                      accent
                    />
                  )}
                </div>

                <div className="mt-6 pt-5 border-t border-dashed border-ink-text/25">
                  <div className="type text-[10px] uppercase tracking-[0.28em]
                                  text-ink-text-dim mb-2">
                    Последний вход
                  </div>
                  <div className="type text-[12px] text-ink-text">
                    {user.createdAt
                      ? formatDateFull(new Date().toISOString())
                      : '—'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>
    </Container>
  );
}

/* ============================================================ */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="type text-[10px] uppercase tracking-[0.24em]
                       text-ink-text-dim">
        {label}
      </span>
      <span className="type text-[12px] text-ink-text text-right
                       font-mono tracking-wider break-all">
        {value}
      </span>
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
    <div className="flex flex-col items-start leading-none">
      <span className="type text-[10px] uppercase tracking-[0.24em]
                       text-ink-text-dim">
        {label}
      </span>
      <span
        className={
          'font-poster text-4xl md:text-5xl tabular-nums mt-2 ' +
          (accent ? 'text-blood' : 'text-ink-text')
        }
      >
        {value}
      </span>
    </div>
  );
}

function ActionLink({
  to,
  title,
  hint,
  primary = false,
  accent = false,
}: {
  to: string;
  title: string;
  hint: string;
  primary?: boolean;
  accent?: boolean;
}) {
  const cls =
    'group flex items-start justify-between gap-4 px-4 py-3.5 border ' +
    'transition-colors cursor-pointer ' +
    (primary
      ? 'bg-blood text-paper border-blood hover:bg-blood-hover '
      : accent
      ? 'border-brass/60 text-brass hover:bg-brass/10 '
      : 'border-ink-text/30 text-ink-text hover:border-ink-text/60 hover:bg-black/[0.04] ');

  return (
    <Link to={to} className={cls}>
      <div className="min-w-0">
        <div
          className={
            'type text-[12px] uppercase tracking-[0.22em] ' +
            (primary ? 'text-paper' : '')
          }
        >
          {title}
        </div>
        <div
          className={
            'type text-[11px] mt-1 ' +
            (primary ? 'text-paper/75' : 'text-ink-text-dim')
          }
        >
          {hint}
        </div>
      </div>
      <span
        className={
          'shrink-0 transition-transform group-hover:translate-x-1 ' +
          (primary ? 'text-paper' : accent ? 'text-brass' : 'text-ink-text-dim')
        }
      >
        →
      </span>
    </Link>
  );
}