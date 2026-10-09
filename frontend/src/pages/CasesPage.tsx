import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCases } from '../api/cases';
import { Container } from '../components/layout/Container';
import { MediaImage } from '../components/MediaImage';
import type { Case } from '../types/case';
import type { ApiErrorResponse } from '../types/api';

export function CasesPage() {
  const [cases, setCases] = useState<Case[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch((err: unknown) => {
        const apiError = err as { response?: { data?: ApiErrorResponse } };
        setError(apiError.response?.data?.message ?? 'Не удалось загрузить дела.');
      });
  }, []);

  return (
    <Container>
      <section className="py-8 md:py-14">

        {/* Заголовок страницы — в одну строку */}
        <div className="mb-12 md:mb-16 max-w-4xl">
          <span className="kicker">Картотека</span>

          <h1 className="mt-6 text-[clamp(2.5rem,6vw,5rem)] leading-[0.9] whitespace-nowrap">
            <span className="text-texture-bone">Открытые </span>
            <span className="text-texture-blood">дела</span>
          </h1>

          <p className="mt-6 text-bone-muted text-base md:text-lg font-light max-w-xl">
            Выбирайте расследование — каждое живёт своей историей,
            своими подозреваемыми и своей правдой.
          </p>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="paper paper-fresh p-6 max-w-2xl border-l-4 border-blood">
            <div className="type text-[12px] uppercase tracking-[0.28em] text-blood mb-2">
              Ошибка
            </div>
            <div className="text-ink-text text-base">{error}</div>
          </div>
        )}

        {/* Загрузка */}
        {cases === null && !error && (
          <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted">
            Раскладываем дела…
          </div>
        )}

        {/* Пусто */}
        {cases && cases.length === 0 && (
          <div className="paper paper-fresh p-8 max-w-2xl relative">
            <div className="pin brass" style={{ top: -6, left: 24 }} />
            <div className="type text-[12px] uppercase tracking-[0.28em] text-ink-text-dim mb-2">
              Пока пусто
            </div>
            <div className="text-ink-text text-base">
              Опубликованных дел нет. Заходите позже — новые расследования появятся скоро.
            </div>
          </div>
        )}

        {/* Сетка дел */}
        {cases && cases.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {cases.map((c) => (
              <CaseCard key={c.id} caseData={c} />
            ))}
          </div>
        )}

      </section>
    </Container>
  );
}

/* ------------------------------------------------------------------ */

function CaseCard({ caseData }: { caseData: Case }) {
  return (
    <Link to={`/cases/${caseData.id}`} className="block group lift">
      <article className="paper paper-old p-5 md:p-6 relative h-full flex flex-col">

        {/* Булавка сверху */}
        <div className="pin" style={{ top: -6, left: 32, zIndex: 20 }} />

        {/* Штамп-номер дела */}
        <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
          <span className="stamp-red text-[12px]">{caseData.code}</span>
        </div>

        {/* Обложка */}
        <div className="relative aspect-[16/9] bg-ink-card overflow-hidden mb-5">
          <div className="photo-corner tl" />
          <div className="photo-corner tr" />
          <div className="photo-corner br" />
          <div className="photo-corner bl" />

          {caseData.coverMediaId ? (
            <MediaImage
              mediaId={caseData.coverMediaId}
              alt={caseData.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 30% 25%, rgba(156,28,28,0.55), transparent 55%), ' +
                    'radial-gradient(circle at 75% 80%, rgba(201,162,74,0.25), transparent 60%), ' +
                    'linear-gradient(135deg, #1a1712 0%, #0b0a08 100%)',
                }}
              />

              <div className="absolute inset-0 bg-black/60" />

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                <div className="type text-[10px] uppercase tracking-[0.32em] text-bone-muted">
                  Место происшествия
                </div>
                <div className="font-poster text-xl md:text-2xl text-bone/95 tracking-wide leading-tight">
                  ФОТО ЗАСЕКРЕЧЕНО
                </div>
                <div className="type text-[10px] uppercase tracking-[0.32em] text-blood">
                  ● доступно участникам
                </div>
              </div>
            </>
          )}

          {/* ── Затемняющие градиенты поверх обложки ── */}

          {/* Верх — плотнее */}
          <div
            className="absolute top-0 inset-x-0 h-20 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0.35) 75%, transparent 100%)',
            }}
          />

          {/* Низ — ещё плотнее и выше */}
          <div
            className="absolute bottom-0 inset-x-0 h-36 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.4) 80%, transparent 100%)',
            }}
          />

          {/* Верхняя строка: жанр + статус */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <span className="type text-[11px] uppercase tracking-[0.28em] text-bone-muted">
              {caseData.genre || 'Дело'}
            </span>
            <span className="type text-[11px] uppercase tracking-[0.28em] text-blood">
              ● Открыто
            </span>
          </div>

          {/* Название на обложке */}
          <div className="absolute inset-x-0 bottom-0 p-4 text-center">
            <div className="type text-[11px] uppercase tracking-[0.32em] text-bone-muted mb-1
                            [text-shadow:0_1px_3px_rgba(0,0,0,1)]">
              Дело · {caseData.code}
            </div>
            <div className="font-poster text-2xl md:text-3xl text-bone leading-tight line-clamp-2
                            [text-shadow:0_2px_8px_rgba(0,0,0,1),0_1px_2px_rgba(0,0,0,1)]">
              {caseData.title}
            </div>
          </div>
        </div>

        {/* Описание */}
        {caseData.description && (
          <p className="text-[15px] md:text-base text-ink-text-soft leading-relaxed line-clamp-3 mb-5">
            {caseData.description}
          </p>
        )}

        {/* Метаданные */}
        <div className="flex flex-wrap gap-2.5 mb-5">
          <MetaChip label={`${caseData.minPlayers}–${caseData.maxPlayers} игроков`} />
          {caseData.durationMinutes != null && (
            <MetaChip label={`~${caseData.durationMinutes} минут`} />
          )}
          <MetaChip label={`${caseData.ageLimit}+`} />
        </div>

        {/* Низ карточки */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-ink-text/20">
          <span className="type text-[12px] uppercase tracking-[0.28em] text-ink-text-dim">
            Штаб следствия
          </span>

          <span className="type text-[12px] uppercase tracking-[0.28em] text-blood
                           group-hover:text-blood-hover transition-colors
                           flex items-center gap-2">
            Открыть дело
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </span>
        </div>

      </article>
    </Link>
  );
}

/* ------------------------------------------------------------------ */

function MetaChip({ label }: { label: string }) {
  return (
    <span className="type text-[12px] uppercase tracking-[0.14em]
                     text-ink-text-soft border border-ink-text/25
                     px-3 py-1.5">
      {label}
    </span>
  );
}