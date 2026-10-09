import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSessionFinalResult } from '../api/finalQuestion';
import { Container } from '../components/layout/Container';
import type { FinalAnswerResult } from '../types/finalQuestion';
import type { ApiErrorResponse } from '../types/api';

export function SessionResultPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<FinalAnswerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getSessionFinalResult(id)
      .then(setResult)
      .catch((err: unknown) => {
        const apiError = err as { response?: { data?: ApiErrorResponse } };
        setError(apiError.response?.data?.message ?? 'Результат недоступен.');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-40 bg-ink flex items-center justify-center">
        <span className="type text-[13px] uppercase tracking-[0.32em] text-bone-muted">
          Вскрываем конверт…
        </span>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-40 bg-ink flex items-center justify-center p-6">
        <div className="paper paper-fresh p-8 max-w-lg w-full border-l-4 border-blood">
          <div className="type text-[11px] uppercase tracking-[0.28em] text-blood mb-3">
            Ошибка
          </div>
          <div className="text-ink-text text-base mb-6">
            {error ?? 'Результат не найден.'}
          </div>
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

  return (
    <div className="min-h-screen bg-board">
      <Container>
        <section className="py-10 md:py-16 max-w-4xl mx-auto">

          {/* ─── Шапка ─── */}
          <div className="text-center mb-12 md:mb-16">
            <span className="kicker justify-center inline-flex">Дело закрыто</span>

            <h1 className="mt-6 text-[clamp(2.5rem,6vw,5rem)] leading-[0.9] text-texture-bone">
              Расследование
              <br />
              <span className="text-texture-blood">завершено</span>
            </h1>

            <div className="mt-6 hand text-2xl md:text-3xl rotate-[-1deg]">
              вы собрали свою версию — вот что было
            </div>
          </div>

          {/* ─── Версия команды ─── */}
          <div className="relative mb-10 md:mb-14">
            <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />
            <div className="pin brass" style={{ top: -8, right: 44, zIndex: 20 }} />

            <div className="paper paper-old p-6 md:p-9 relative">
              <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
                <span className="stamp-red text-xs">Ваша версия</span>
              </div>

              <div className="flex items-baseline justify-between pb-3 mb-6
                              border-b border-dashed border-ink-text/25">
                <span className="type text-[11px] uppercase tracking-[0.3em] text-ink-text-soft">
                  Что написали игроки
                </span>
              </div>

              <div
                className="text-ink-text text-[15px] leading-relaxed whitespace-pre-line"
                style={{ fontFamily: 'var(--font-type, monospace)' }}
              >
                {result.selectedOptionText}
              </div>
            </div>
          </div>

          {/* ─── Письмо-разгадка ─── */}
          {result.explanationText && (
            <div className="relative mb-10 md:mb-14">
              <div className="pin brass" style={{ top: -8, left: '50%', marginLeft: -7, zIndex: 20 }} />

              <div className="paper paper-fresh p-6 md:p-12 relative">
                <div className="absolute -top-3 -left-3 rotate-[-6deg] z-10">
                  <span className="stamp-red text-xs">Правда</span>
                </div>

                <div className="type text-[10px] uppercase tracking-[0.32em]
                                text-ink-text-dim mb-4">
                  Как было на самом деле
                </div>

                <h2 className="font-poster text-3xl md:text-4xl text-ink-text leading-tight mb-8">
                  Что произошло
                </h2>

                <div
                  className="text-ink-text text-[15px] md:text-[16px] leading-[1.75]
                             whitespace-pre-line
                             [&>p]:mb-5"
                  style={{ fontFamily: 'var(--font-type, monospace)' }}
                >
                  {result.explanationText}
                </div>
              </div>
            </div>
          )}

          {/* ─── Ключевые улики ─── */}
          {result.revealedEvidences.length > 0 && (
            <div className="relative mb-10 md:mb-14">
              <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />

              <div className="paper paper-old p-6 md:p-9 relative">
                <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
                  <span className="stamp-red text-xs">Улики</span>
                </div>

                <div className="type text-[10px] uppercase tracking-[0.32em]
                                text-ink-text-dim mb-4">
                  Ключевые улики · {result.revealedEvidences.length}
                </div>

                <h2 className="font-poster text-3xl md:text-4xl text-ink-text leading-tight mb-8">
                  На чём всё держалось
                </h2>

                <ul className="flex flex-col gap-5">
                  {result.revealedEvidences.map((e) => (
                    <li
                      key={e.id}
                      className="pl-5 border-l-2 border-blood/70 py-1"
                    >
                      <div className="font-poster text-lg text-ink-text leading-tight mb-2">
                        {e.title}
                      </div>
                      {e.contentText && (
                        <div
                          className="text-ink-text-soft text-[13px] leading-relaxed whitespace-pre-line"
                          style={{ fontFamily: 'var(--font-type, monospace)' }}
                        >
                          {e.contentText}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ─── Действия ─── */}
          <div className="flex flex-wrap gap-3 justify-center pt-6">
            <Link
              to="/my-sessions"
              className="px-6 py-3 border border-brass/50 bg-ink/60 text-brass
                         type text-[12px] uppercase tracking-[0.26em]
                         hover:bg-brass/10 transition-colors"
            >
              К моим сессиям
            </Link>
            <Link
              to="/cases"
              className="px-6 py-3 bg-blood text-paper
                         type text-[12px] uppercase tracking-[0.26em]
                         hover:bg-blood-hover transition-colors"
            >
              К каталогу дел
            </Link>
          </div>

        </section>
      </Container>
    </div>
  );
}