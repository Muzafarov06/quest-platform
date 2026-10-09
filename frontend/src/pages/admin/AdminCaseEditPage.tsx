import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getAdminCase, updateCase, publishCase, unpublishCase, startTestSession,
} from '../../api/admin';
import { Container } from '../../components/layout/Container';
import { MediaUploader } from '../../components/admin/MediaUploader';
import { NumberInput } from '../../components/ui/NumberInput';
import { Select, type SelectOption } from '../../components/ui/Select';
import { AdminLocationsTab } from './AdminLocationsTab';
import { AdminEvidencesTab } from './AdminEvidencesTab';
import { AdminEventsTab } from './AdminEventsTab';
import { AdminFinalTab } from './AdminFinalTab';
import { AdminCharactersTab } from './AdminCharactersTab';
import type { Case, CaseStatus } from '../../types/case';
import type { ApiErrorResponse } from '../../types/api';

const GENRE_OPTIONS: SelectOption[] = [
  { value: 'DETECTIVE', label: '🕵️ Детектив' },
  { value: 'HORROR', label: '👻 Хоррор' },
  { value: 'MYSTERY', label: '🧩 Мистика' },
  { value: 'CRIME', label: '🚔 Криминал' },
  { value: 'SCI_FI', label: '🚀 Фантастика' },
  { value: 'HISTORICAL', label: '🕰 Исторический' },
  { value: 'PSYCHOLOGICAL', label: '🧠 Психология' },
  { value: 'DIGITAL', label: '💻 Цифровое расследование' },
];

const INPUT =
  'w-full bg-transparent border-b-2 border-ink-text/40 text-ink-text ' +
  'placeholder:text-ink-text-dim/70 focus:outline-none focus:border-blood ' +
  'font-type text-base px-0 py-2 transition-colors';

type Tab = 'metadata' | 'locations' | 'evidences' | 'events' | 'characters' | 'final';

const TAB_LABEL: Record<Tab, string> = {
  metadata: 'Метаданные',
  locations: 'Локации',
  evidences: 'Улики',
  events: 'События',
  characters: 'Персонажи',
  final: 'Финал',
};

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

export function AdminCaseEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('metadata');

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('DETECTIVE');
  const [ageLimit, setAgeLimit] = useState(16);
  const [minPlayers, setMinPlayers] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [priceCents, setPriceCents] = useState(0);
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [isStartingTest, setIsStartingTest] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishReasons, setPublishReasons] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getAdminCase(id)
      .then((c) => {
        setCaseData(c);
        setTitle(c.title);
        setDescription(c.description ?? '');
        setGenre(c.genre);
        setAgeLimit(c.ageLimit);
        setMinPlayers(c.minPlayers);
        setMaxPlayers(c.maxPlayers);
        setDurationMinutes(c.durationMinutes ?? '');
        setPriceCents(c.priceCents);
        setCoverMediaId(c.coverMediaId ?? null);
      })
      .catch((err: unknown) => {
        const apiError = err as { response?: { data?: ApiErrorResponse } };
        setError(apiError.response?.data?.message ?? 'Не удалось загрузить кейс.');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const isPublished = caseData?.status === 'PUBLISHED';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaveError(null);
    setSaved(false);
    setIsSubmitting(true);
    try {
      const updated = await updateCase(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        genre,
        ageLimit,
        minPlayers,
        maxPlayers,
        durationMinutes: durationMinutes === '' ? undefined : durationMinutes,
        priceCents,
        coverMediaId: coverMediaId ?? undefined,
      });
      setCaseData(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setSaveError(apiError.response?.data?.message ?? 'Не удалось сохранить.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    if (!confirm('Опубликовать кейс? После публикации редактирование будет заблокировано.')) return;
    setIsPublishing(true);
    setPublishError(null);
    setPublishReasons([]);
    try {
      const updated = await publishCase(id);
      setCaseData(updated);
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { message?: string; reasons?: string[] } };
      };
      setPublishError(apiError.response?.data?.message ?? 'Не удалось опубликовать');
      setPublishReasons(apiError.response?.data?.reasons ?? []);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!id) return;
    if (!confirm('Снять с публикации? Кейс исчезнет из каталога.')) return;
    setIsPublishing(true);
    setPublishError(null);
    try {
      const updated = await unpublishCase(id);
      setCaseData(updated);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setPublishError(apiError.response?.data?.message ?? 'Не удалось снять с публикации');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleStartTest = async () => {
    if (!id) return;
    setIsStartingTest(true);
    try {
      const session = await startTestSession(id);
      navigate(`/rooms/${session.roomCode}`);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      alert(apiError.response?.data?.message ?? 'Не удалось создать тест-сессию');
      setIsStartingTest(false);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <section className="py-10">
          <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted">
            Открываем папку дела…
          </div>
        </section>
      </Container>
    );
  }

  if (error || !caseData || !id) {
    return (
      <Container>
        <section className="py-10">
          <div className="border border-blood/40 bg-blood/10 p-6 max-w-2xl">
            <div className="type text-[12px] uppercase tracking-[0.28em] text-blood mb-2">
              Ошибка
            </div>
            <div className="text-bone text-base mb-4">
              {error ?? 'Кейс не найден.'}
            </div>
            <Link to="/admin" className="type text-[12px] uppercase tracking-[0.24em]
                                          text-blood hover:text-blood-hover">
              ← К списку
            </Link>
          </div>
        </section>
      </Container>
    );
  }

  return (
    <Container>
      <section className="py-8 md:py-12">

        <Link
          to="/admin"
          className="type text-[12px] uppercase tracking-[0.28em]
                     text-bone-muted hover:text-bone transition-colors"
        >
          ← К списку дел
        </Link>

        <div className="mt-6 mb-8 flex items-end justify-between gap-6 flex-wrap">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span
                className={
                  'type text-[11px] uppercase tracking-[0.24em] px-2.5 py-1 border ' +
                  STATUS_CLASS[caseData.status]
                }
              >
                {STATUS_LABEL[caseData.status]}
              </span>
              <span className="font-mono text-[13px] tracking-[0.18em] text-brass">
                {caseData.code}
              </span>
            </div>

            <h1 className="text-[clamp(1.75rem,4vw,3rem)] leading-[0.95] text-texture-bone">
              {caseData.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to={`/admin/cases/${id}/map`}
              className="inline-flex items-center gap-2
                        bg-brass/20 text-brass border border-brass/50 px-5 py-3
                        type text-[12px] uppercase tracking-[0.24em]
                        hover:bg-brass/30 transition-colors"
            >
              🗺 Карта дела
            </Link>
            <button
              type="button"
              onClick={handleStartTest}
              disabled={isStartingTest}
              className="inline-flex items-center gap-2
                         bg-emerald-700 text-paper px-5 py-3
                         type text-[12px] uppercase tracking-[0.24em]
                         hover:bg-emerald-600 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed
                         cursor-pointer"
            >
              {isStartingTest ? 'Создаём…' : '▶ Тестовый запуск'}
            </button>

            {isPublished ? (
              <button
                type="button"
                onClick={handleUnpublish}
                disabled={isPublishing}
                className="inline-flex items-center gap-2
                           bg-brass/20 text-brass border border-brass/50 px-5 py-3
                           type text-[12px] uppercase tracking-[0.24em]
                           hover:bg-brass/30 transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed
                           cursor-pointer"
              >
                {isPublishing ? '…' : 'Снять с публикации'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="inline-flex items-center gap-2
                           bg-blood text-paper px-5 py-3
                           type text-[12px] uppercase tracking-[0.24em]
                           hover:bg-blood-hover transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed
                           cursor-pointer"
              >
                {isPublishing ? '…' : '✓ Опубликовать'}
              </button>
            )}
          </div>
        </div>

        {publishError && (
          <div className="mb-6 border border-blood/40 bg-blood/10 p-5 max-w-3xl">
            <div className="type text-[12px] uppercase tracking-[0.28em] text-blood mb-2">
              {publishError}
            </div>
            {publishReasons.length > 0 && (
              <ul className="list-disc list-inside text-bone text-sm space-y-1">
                {publishReasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </div>
        )}

        {isPublished && (
          <div className="mb-8 border border-green-600/50 bg-green-700/10 p-5 max-w-3xl">
            <div className="type text-[12px] uppercase tracking-[0.28em] text-green-300 mb-2">
              Кейс опубликован
            </div>
            <div className="text-bone text-sm">
              Редактирование заблокировано. Чтобы поправить — снимите с публикации.
            </div>
          </div>
        )}

        {!isPublished && (
          <>
            <div className="flex gap-1 flex-wrap border-b border-brass/30 mb-8">
              {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={
                    'px-4 sm:px-5 py-3 -mb-px border-b-2 transition-colors ' +
                    'type text-[12px] uppercase tracking-[0.24em] cursor-pointer ' +
                    (tab === t
                      ? 'border-blood text-blood'
                      : 'border-transparent text-bone-muted hover:text-bone')
                  }
                >
                  {TAB_LABEL[t]}
                </button>
              ))}
            </div>

            {tab === 'metadata' && (
              <div className="max-w-3xl">
                <div className="relative">
                  <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />

                  <form
                    onSubmit={handleSubmit}
                    className="paper paper-old p-7 md:p-9 relative flex flex-col gap-7"
                  >
                    <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
                      <span className="stamp-red text-xs">Дело</span>
                    </div>

                    <div className="flex items-baseline justify-between mb-2 pb-3
                                    border-b border-ink-text/20">
                      <span className="type text-[11px] uppercase tracking-[0.28em] text-ink-text-soft">
                        Карточка дела
                      </span>
                      <span className="font-mono text-[13px] tracking-[0.18em] text-blood">
                        {caseData.code}
                      </span>
                    </div>

                    <Field label="Название">
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required maxLength={200}
                        className={INPUT}
                      />
                    </Field>

                    <Field label="Описание">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        className={INPUT + ' resize-none'}
                      />
                    </Field>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field label="Жанр">
                        <Select
                          value={genre}
                          onChange={setGenre}
                          options={GENRE_OPTIONS}
                          variant="paper"
                        />
                      </Field>

                      <Field label="Возрастное ограничение">
                        <NumberInput
                          value={ageLimit}
                          onChange={(v) => setAgeLimit(v === '' ? 16 : v)}
                          min={0}
                          max={21}
                          className={INPUT}
                          variant="paper"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <Field label="Мин. игроков">
                        <NumberInput
                          value={minPlayers}
                          onChange={(v) => setMinPlayers(v === '' ? 1 : v)}
                          min={1}
                          className={INPUT}
                          variant="paper"
                        />
                      </Field>

                      <Field label="Макс. игроков">
                        <NumberInput
                          value={maxPlayers}
                          onChange={(v) => setMaxPlayers(v === '' ? 1 : v)}
                          min={1}
                          className={INPUT}
                          variant="paper"
                        />
                      </Field>

                      <Field label="Длительность (мин)">
                        <NumberInput
                          value={durationMinutes}
                          onChange={setDurationMinutes}
                          min={1}
                          max={1440}
                          className={INPUT}
                          variant="paper"
                          allowEmpty
                        />
                      </Field>
                    </div>

                    <Field label="Цена (в копейках)">
                      <NumberInput
                        value={priceCents}
                        onChange={(v) => setPriceCents(v === '' ? 0 : v)}
                        min={0}
                        step={100}
                        className={INPUT}
                        variant="paper"
                      />
                    </Field>

                    <div className="pt-4 border-t border-ink-text/20">
                      <MediaUploader
                        caseId={id}
                        value={coverMediaId}
                        onChange={setCoverMediaId}
                        label="Обложка дела"
                        hint="Видна в каталоге. Соотношение 16:10."
                        aspect="video"
                      />
                    </div>

                    {saveError && (
                      <div className="px-4 py-3 bg-blood/15 border-l-4 border-blood
                                      type text-[13px] text-blood">
                        {saveError}
                      </div>
                    )}
                    {saved && (
                      <div className="px-4 py-3 bg-green-700/15 border-l-4 border-green-600
                                      type text-[13px] text-green-300">
                        ✓ Сохранено
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blood text-paper px-7 py-3
                                   type text-[13px] uppercase tracking-[0.26em]
                                   hover:bg-blood-hover transition-colors
                                   disabled:opacity-40 disabled:cursor-not-allowed
                                   cursor-pointer"
                      >
                        {isSubmitting ? 'Сохраняем…' : 'Сохранить'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {tab === 'locations' && <AdminLocationsTab caseId={id} />}
            {tab === 'evidences' && <AdminEvidencesTab caseId={id} />}
            {tab === 'events' && <AdminEventsTab caseId={id} />}
            {tab === 'characters' && <AdminCharactersTab caseId={id} />}
            {tab === 'final' && <AdminFinalTab caseId={id} />}
          </>
        )}

      </section>
    </Container>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="type text-[11px] uppercase tracking-[0.24em] text-ink-text-dim">
        {label}
      </span>
      {children}
    </label>
  );
}