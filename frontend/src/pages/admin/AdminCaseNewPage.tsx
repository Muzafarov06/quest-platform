import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createCase, getNextCaseCode } from '../../api/admin';
import { Container } from '../../components/layout/Container';
import { NumberInput } from '../../components/ui/NumberInput';
import { Select, type SelectOption } from '../../components/ui/Select';
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
  'placeholder:text-ink-text-dim/70 placeholder:italic focus:outline-none ' +
  'focus:border-blood font-type text-base px-0 py-2 transition-colors';

export function AdminCaseNewPage() {
  const navigate = useNavigate();

  const [code, setCode] = useState<string>('');
  const [isLoadingCode, setIsLoadingCode] = useState(true);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('DETECTIVE');
  const [ageLimit, setAgeLimit] = useState(16);
  const [minPlayers, setMinPlayers] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [priceCents, setPriceCents] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoadingCode(true);
    setCodeError(null);
    getNextCaseCode()
      .then(setCode)
      .catch(() => setCodeError('Не удалось получить код — обновите страницу.'))
      .finally(() => setIsLoadingCode(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});
    setIsSubmitting(true);

    try {
      const created = await createCase({
        code: code.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        genre,
        ageLimit,
        minPlayers,
        maxPlayers,
        durationMinutes: durationMinutes === '' ? undefined : durationMinutes,
        priceCents,
      });
      navigate(`/admin/cases/${created.id}`);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      const data = apiError.response?.data;
      if (data?.validationErrors) setValidationErrors(data.validationErrors);
      else setError(data?.message ?? 'Не удалось создать кейс.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (field: string) => validationErrors[field];

  return (
    <Container>
      <section className="py-10 md:py-14">

        <Link
          to="/admin"
          className="type text-[12px] uppercase tracking-[0.28em]
                     text-bone-muted hover:text-bone transition-colors"
        >
          ← К списку дел
        </Link>

        <div className="mt-8 mb-10 md:mb-12 max-w-3xl">
          <span className="kicker">Новое дело</span>

          <h1 className="mt-6 text-[clamp(2.5rem,6vw,5rem)] leading-[0.9]">
            <span className="text-texture-bone">Завести </span>
            <span className="text-texture-blood">папку</span>
          </h1>

          <p className="mt-6 text-bone-muted text-base md:text-lg leading-relaxed max-w-xl">
            Метаданные видны игрокам в каталоге. Дальше — сцены, улики,
            персонажи, финал. Всё редактируется отдельно.
          </p>

          <div className="mt-6 hand text-2xl md:text-3xl rotate-[-1deg]">
            код присваивается автоматически
          </div>
        </div>

        <div className="max-w-3xl relative">
          <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />

          <form
            onSubmit={handleSubmit}
            className="paper paper-old p-7 md:p-9 relative flex flex-col gap-7"
          >
            <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
              <span className="stamp-red text-xs">Новое</span>
            </div>

            <div className="flex items-baseline justify-between pb-3
                            border-b border-ink-text/20">
              <span className="type text-[11px] uppercase tracking-[0.28em] text-ink-text-soft">
                Карточка дела
              </span>
              <span className="font-mono text-[13px] tracking-[0.18em] text-blood">
                {isLoadingCode ? '…' : code || '—'}
              </span>
            </div>

            {codeError && (
              <div className="px-4 py-3 bg-blood/15 border-l-4 border-blood
                              type text-[13px] text-blood">
                {codeError}
              </div>
            )}

            <Field label="Название" required error={fieldError('title')}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                placeholder="Мармелад для Беллы"
                className={INPUT}
              />
            </Field>

            <Field label="Описание" hint="Видно в каталоге. Без спойлеров.">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Краткий сюжет: где, когда, что произошло."
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

              <Field label="Длительность, мин">
                <NumberInput
                  value={durationMinutes}
                  onChange={setDurationMinutes}
                  min={1}
                  max={1440}
                  placeholder="90"
                  className={INPUT}
                  variant="paper"
                  allowEmpty
                />
              </Field>
            </div>

            <Field label="Цена, коп." hint="0 = бесплатно. 19900 = 199 ₽.">
              <NumberInput
                value={priceCents}
                onChange={(v) => setPriceCents(v === '' ? 0 : v)}
                min={0}
                step={100}
                className={INPUT}
                variant="paper"
              />
            </Field>

            {error && (
              <div className="px-4 py-3 bg-blood/15 border-l-4 border-blood
                              type text-[13px] text-blood">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-3 flex-wrap">
              <button
                type="submit"
                disabled={isSubmitting || isLoadingCode || !code}
                className="bg-blood text-paper px-7 py-3
                           type text-[13px] uppercase tracking-[0.26em]
                           hover:bg-blood-hover transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed
                           cursor-pointer"
              >
                {isSubmitting ? 'Заводим…' : 'Создать дело'}
              </button>

              <Link
                to="/admin"
                className="inline-flex items-center px-6 py-3
                           border border-ink-text/40 text-ink-text
                           type text-[13px] uppercase tracking-[0.26em]
                           hover:border-ink-text/70 hover:bg-black/5
                           transition-colors"
              >
                Отмена
              </Link>
            </div>
          </form>
        </div>

      </section>
    </Container>
  );
}

function Field({
  label,
  children,
  required,
  error,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="type text-[11px] uppercase tracking-[0.24em] text-ink-text-dim">
        {label}
        {required && <span className="text-blood ml-1">*</span>}
      </span>
      {children}
      {error && <span className="type text-[12px] text-blood">{error}</span>}
      {!error && hint && <span className="type text-[11px] text-ink-text-dim">{hint}</span>}
    </label>
  );
}