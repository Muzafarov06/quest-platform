import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  listAllCases,
  getCaseDeleteInfo,
  deleteCase,
  type CaseDeleteInfo,
} from '../../api/admin';
import { Container } from '../../components/layout/Container';
import { AdminDeleteCaseModal } from '../../components/admin/AdminDeleteCaseModal';
import type { Case, CaseStatus } from '../../types/case';
import type { ApiErrorResponse } from '../../types/api';

/* ============================================================
   Статусы в стилистике сайта
   ============================================================ */

const STATUS_LABEL: Record<CaseStatus, string> = {
  DRAFT: 'Черновик',
  TESTING: 'Тестируется',
  PUBLISHED: 'Опубликовано',
  ARCHIVED: 'Архив',
};

const STATUS_CLASS: Record<CaseStatus, string> = {
  DRAFT: 'bg-bone/10 text-bone-muted border-bone/25',
  TESTING: 'bg-brass/15 text-brass border-brass/50',
  PUBLISHED: 'bg-green-700/20 text-green-300 border-green-600/50',
  ARCHIVED: 'bg-blood/15 text-blood border-blood/50',
};

export function AdminCasesPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* Модалка удаления. */
  const [deleteTarget, setDeleteTarget] = useState<CaseDeleteInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const reload = async () => {
    setError(null);
    try {
      const list = await listAllCases();
      setCases(list);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось загрузить список.');
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const handleDeleteClick = async (c: Case) => {
    try {
      const info = await getCaseDeleteInfo(c.id);
      setDeleteTarget(info);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      alert(apiError.response?.data?.message ?? 'Не удалось получить данные');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCase(deleteTarget.caseId);
      setDeleteTarget(null);
      await reload();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      alert(apiError.response?.data?.message ?? 'Не удалось удалить кейс');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Container>
      <section className="py-10 md:py-14">

        {/* ───────── Заголовок ───────── */}
        <div className="mb-12 md:mb-16 flex items-end justify-between gap-6 flex-wrap">
          <div className="max-w-3xl">
            <span className="kicker">Панель управления</span>

            <h1 className="mt-6 text-[clamp(2.5rem,6vw,5rem)] leading-[0.9]">
              <span className="text-texture-bone">Все </span>
              <span className="text-texture-blood">дела</span>
            </h1>

            <p className="mt-6 text-bone-muted text-base md:text-lg leading-relaxed max-w-xl">
              Черновики, тесты, опубликованные и архивные расследования.
              Откройте дело, чтобы настроить сцены, улики, персонажей и финал.
            </p>
          </div>

          <Link
            to="/admin/cases/new"
            className="inline-flex items-center gap-3
                       bg-blood text-paper px-6 py-3.5
                       type text-[13px] uppercase tracking-[0.26em]
                       hover:bg-blood-hover transition-colors"
          >
            <span>+ Создать кейс</span>
          </Link>
        </div>

        {/* ───────── Ошибка ───────── */}
        {error && (
          <div className="border border-blood/40 bg-blood/10 p-6 max-w-2xl">
            <div className="type text-[12px] uppercase tracking-[0.28em] text-blood mb-2">
              Ошибка
            </div>
            <div className="text-bone text-base">{error}</div>
          </div>
        )}

        {/* ───────── Загрузка ───────── */}
        {cases === null && !error && (
          <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted">
            Открываем картотеку…
          </div>
        )}

        {/* ───────── Пусто ───────── */}
        {cases && cases.length === 0 && (
          <div className="border border-bone/20 p-10 max-w-2xl">
            <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted mb-3">
              Картотека пуста
            </div>
            <div className="text-bone text-lg mb-6">
              Пока ни одного дела. Создайте первое.
            </div>
            <Link
              to="/admin/cases/new"
              className="inline-flex items-center gap-2
                         type text-[13px] uppercase tracking-[0.24em]
                         text-blood hover:text-blood-hover
                         underline underline-offset-4 decoration-dotted
                         transition-colors"
            >
              Создать первый кейс →
            </Link>
          </div>
        )}

        {/* ───────── Таблица ───────── */}
        {cases && cases.length > 0 && (
          <div
            className="relative border border-brass/30 bg-ink/60 backdrop-blur-sm
                       overflow-hidden"
            style={{
              boxShadow:
                'inset 0 1px 0 rgba(201,162,74,0.12), ' +
                '0 14px 46px rgba(0,0,0,0.7)',
            }}
          >
            <Corner pos="tl" />
            <Corner pos="tr" />
            <Corner pos="bl" />
            <Corner pos="br" />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brass/30">
                    <Th>Код</Th>
                    <Th>Название</Th>
                    <Th className="hidden md:table-cell">Жанр</Th>
                    <Th className="hidden lg:table-cell">Игроки</Th>
                    <Th>Статус</Th>
                    <Th className="hidden md:table-cell">Обновлён</Th>
                    <Th className="text-right">Действия</Th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-brass/15 last:border-0
                                 hover:bg-brass/[0.06] transition-colors group"
                    >
                      <Td>
                        <Link
                          to={`/admin/cases/${c.id}`}
                          className="font-mono text-[13px] tracking-[0.14em] text-brass
                                     hover:text-brass-hover transition-colors"
                        >
                          {c.code}
                        </Link>
                      </Td>

                      <Td>
                        <Link
                          to={`/admin/cases/${c.id}`}
                          className="font-poster text-lg md:text-xl text-bone
                                     group-hover:text-blood transition-colors
                                     leading-tight"
                        >
                          {c.title}
                        </Link>
                      </Td>

                      <Td className="hidden md:table-cell">
                        <span className="type text-[12px] uppercase tracking-[0.2em] text-bone-muted">
                          {c.genre}
                        </span>
                      </Td>

                      <Td className="hidden lg:table-cell">
                        <span className="type text-[13px] text-bone-muted">
                          {c.minPlayers}–{c.maxPlayers}
                        </span>
                      </Td>

                      <Td>
                        <span
                          className={
                            'inline-flex type text-[11px] uppercase tracking-[0.22em] ' +
                            'px-2.5 py-1 border ' + STATUS_CLASS[c.status]
                          }
                        >
                          {STATUS_LABEL[c.status]}
                        </span>
                      </Td>

                      <Td className="hidden md:table-cell">
                        <span className="type text-[12px] text-bone-dim whitespace-nowrap">
                          {formatDate(c.updatedAt)}
                        </span>
                      </Td>

                      <Td className="text-right whitespace-nowrap">
                        <Link
                          to={`/admin/cases/${c.id}`}
                          className="inline-flex px-2.5 py-1
                                     border border-brass/40 text-brass
                                     type text-[10px] uppercase tracking-[0.2em]
                                     hover:bg-brass/10 transition-colors mr-2"
                        >
                          Открыть
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(c)}
                          title="Удалить кейс"
                          className="inline-flex w-7 h-7 items-center justify-center
                                     border border-blood/50 text-blood
                                     type text-[12px] leading-none
                                     hover:bg-blood hover:text-paper
                                     transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Нижняя строка */}
            <div className="flex items-center justify-between gap-4
                            px-5 sm:px-7 py-3.5 border-t border-brass/25
                            bg-ink/50">
              <span className="type text-[12px] uppercase tracking-[0.26em] text-bone-muted">
                Всего: <span className="text-bone">{cases.length}</span>
              </span>
              <span className="type text-[12px] uppercase tracking-[0.26em] text-brass">
                ● Опубликовано:{' '}
                <span className="text-bone">
                  {cases.filter((c) => c.status === 'PUBLISHED').length}
                </span>
              </span>
            </div>
          </div>
        )}

      </section>

      {/* Модалка удаления */}
      {deleteTarget && (
        <AdminDeleteCaseModal
          info={deleteTarget}
          busy={isDeleting}
          onConfirm={confirmDelete}
          onClose={() => !isDeleting && setDeleteTarget(null)}
          onGoToSessions={() => navigate('/my-sessions')}
        />
      )}
    </Container>
  );
}

/* ============================================================
   Мелкие компоненты
   ============================================================ */

function Th({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={
        'text-left px-5 sm:px-7 py-4 ' +
        'type text-[11px] uppercase tracking-[0.28em] text-brass ' +
        className
      }
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={'px-5 sm:px-7 py-4 align-middle ' + className}>
      {children}
    </td>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 12;
  const style: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    borderColor: 'rgba(201,162,74,0.85)',
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