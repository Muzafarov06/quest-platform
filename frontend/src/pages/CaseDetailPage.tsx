import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCase } from '../api/cases';
import { createSession } from '../api/sessions';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { MediaImage } from '../components/MediaImage';
import type { Case } from '../types/case';
import type { ApiErrorResponse } from '../types/api';

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    getCase(id)
      .then(setCaseData)
      .catch((err: unknown) => {
        const apiError = err as { response?: { data?: ApiErrorResponse } };
        setError(apiError.response?.data?.message ?? 'Не удалось загрузить дело.');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleCreateSession = async () => {
    if (!id) return;
    setIsCreatingSession(true);
    try {
      const session = await createSession(id);
      navigate(`/rooms/${session.roomCode}`);
    } catch {
      setIsCreatingSession(false);
      alert('Не удалось создать сессию');
    }
  };

  return (
    <Container>
      <section className="py-8 md:py-14">

        {/* Назад */}
        <Link
          to="/cases"
          className="type text-[12px] uppercase tracking-[0.28em] text-bone-muted
                     hover:text-bone transition-colors inline-flex items-center gap-2"
        >
          ← Все дела
        </Link>

        {/* Ошибка */}
        {error && (
          <div className="mt-8 paper paper-fresh p-6 max-w-2xl border-l-4 border-blood">
            <div className="type text-[12px] uppercase tracking-[0.28em] text-blood mb-2">
              Ошибка
            </div>
            <div className="text-ink-text text-base">{error}</div>
          </div>
        )}

        {/* Загрузка */}
        {isLoading && !error && (
          <div className="mt-8 type text-[13px] uppercase tracking-[0.28em] text-bone-muted">
            Открываем папку…
          </div>
        )}

        {/* Контент */}
        {caseData && !isLoading && (
          <>
            {/* Заголовок */}
            <div className="mt-8 md:mt-10 mb-10 md:mb-14 max-w-4xl">
              <span className="kicker">
                {caseData.genre || 'Дело'} · {caseData.status}
              </span>

              <h1 className="mt-6 text-[clamp(2.25rem,5.5vw,4.75rem)] leading-[0.9] text-texture-bone">
                {caseData.title}
              </h1>

              <div className="mt-4 -rotate-2">
                <span className="hand text-2xl md:text-3xl">
                  Дело № {caseData.code}
                </span>
              </div>
            </div>

            {/* Основная сетка: фото + метаданные */}
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-14 items-start">

              {/* ЛЕВАЯ КОЛОНКА — фото / обложка */}
              <div className="relative">
                <div className="pin" style={{ top: -6, left: 44, zIndex: 20 }} />

                <div className="paper paper-old p-3 md:p-4 relative rotate-[1deg] shadow-paper-lift">
                  {/* Штамп "Сов. секретно" в углу */}
                  <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
                    <span className="stamp-red text-xs">Сов. секретно</span>
                  </div>

                  <div className="relative aspect-[4/5] md:aspect-[3/4] bg-ink-card overflow-hidden">
                    <div className="photo-corner tl" />
                    <div className="photo-corner tr" />
                    <div className="photo-corner br" />
                    <div className="photo-corner bl" />

                    {caseData.coverMediaId ? (
                      <MediaImage
                        mediaId={caseData.coverMediaId}
                        alt={caseData.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        {/* Фон-заглушка */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              'radial-gradient(circle at 30% 25%, rgba(156,28,28,0.55), transparent 55%), ' +
                              'radial-gradient(circle at 75% 80%, rgba(201,162,74,0.25), transparent 60%), ' +
                              'linear-gradient(135deg, #1a1712 0%, #0b0a08 100%)',
                          }}
                        />

                        {/* Усиленное затемнение */}
                        <div className="absolute inset-0 bg-black/60" />

                        {/* Центральный текст */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                          <div className="type text-[11px] uppercase tracking-[0.32em] text-bone-muted">
                            Место происшествия
                          </div>

                          <div className="font-poster text-3xl md:text-5xl text-bone/95 tracking-wide leading-[0.95]">
                            ФОТО
                            <br />
                            ЗАСЕКРЕЧЕНО
                          </div>

                          <div className="mt-2 type text-[11px] uppercase tracking-[0.32em] text-blood">
                            ● Доступно участникам
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Нижняя подпись под фото */}
                  <div className="mt-3 pt-3 flex items-center justify-between
                                  border-t border-ink-text/20">
                    <span className="type text-[11px] uppercase tracking-[0.24em] text-ink-text-dim">
                      Материалы дела
                    </span>
                    <span className="hand text-lg text-blood rotate-[-3deg]">
                      не для чужих глаз
                    </span>
                  </div>
                </div>
              </div>

              {/* ПРАВАЯ КОЛОНКА — описание + метаданные + кнопка */}
              <div className="relative">

                {/* Описание */}
                {caseData.description && (
                  <p className="text-base md:text-lg text-bone leading-relaxed whitespace-pre-line">
                    {caseData.description}
                  </p>
                )}

                {/* Метаданные — атмосферные строки */}
                <div className="mt-10 space-y-3">
                  <MetaRow label="Формат"  value={caseData.genre || 'Расследование'} />
                  <MetaRow
                    label="Команда"
                    value={`${caseData.minPlayers}–${caseData.maxPlayers} игроков`}
                  />
                  {caseData.durationMinutes != null && (
                    <MetaRow label="Сессия" value={`~${caseData.durationMinutes} минут`} />
                  )}
                  <MetaRow label="Уровень" value={`${caseData.ageLimit}+`} />
                  {caseData.priceCents > 0 && (
                    <MetaRow
                      label="Стоимость"
                      value={`${(caseData.priceCents / 100).toFixed(0)} ₽`}
                    />
                  )}
                </div>

                {/* Рукописная пометка */}
                <div className="mt-8 -rotate-1">
                  <span className="hand text-xl md:text-2xl">
                    Соберите команду — и в путь
                  </span>
                </div>

                {/* Кнопка запуска */}
                <div className="mt-8">
                  <Button
                    variant="primary"
                    size="lg"
                    withArrow
                    onClick={handleCreateSession}
                    disabled={isCreatingSession}
                    className="w-full sm:w-auto"
                  >
                    {isCreatingSession ? 'Создаём…' : 'Создать сессию'}
                  </Button>
                </div>

                {/* Нижняя строка с датой */}
                <div className="mt-10 pt-5 border-t border-ink-line/60">
                  <span className="type text-[11px] uppercase tracking-[0.24em] text-bone-dim">
                    Дело заведено:{' '}
                    {new Date(caseData.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>

              </div>
            </div>
          </>
        )}

      </section>
    </Container>
  );
}

/* ------------------------------------------------------------------ */

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 pb-2.5
                    border-b border-dotted border-bone/15">
      <span className="type text-[11px] uppercase tracking-[0.28em] text-bone-muted">
        {label}
      </span>
      <span className="type text-[13px] uppercase tracking-[0.14em] text-bone text-right">
        {value}
      </span>
    </div>
  );
}