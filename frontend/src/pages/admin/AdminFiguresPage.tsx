import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Container } from '../../components/layout/Container';
import { FigureImage } from '../../components/FigureImage';
import {
  adminListFigures,
  adminCreateFigure,
  adminUpdateFigure,
  adminToggleFigure,
  adminDeleteFigure,
} from '../../api/figures';
import { invalidateFiguresCache } from '../../hooks/useFigures';
import type { Figure } from '../../types/figure';
import type { ApiErrorResponse } from '../../types/api';

/* ============================================================
   Стили полей формы — как на страницах логина (paper-input)
   ============================================================ */

const INPUT_PAPER =
  'w-full bg-transparent border-b-2 border-ink-text/40 text-ink-text ' +
  'placeholder:text-ink-text-dim/70 placeholder:italic focus:outline-none ' +
  'focus:border-blood font-type text-lg rounded-none px-0 py-2 transition-colors';

/* ============================================================
   Страница
   ============================================================ */

export function AdminFiguresPage() {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await adminListFigures();
      setFigures(list);
      invalidateFiguresCache();
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось загрузить фигурки.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!label.trim()) {
      setFormError('Введите название');
      return;
    }
    if (!file) {
      setFormError('Загрузите PNG — без него фигурку не создать');
      return;
    }

    setIsSaving(true);
    try {
      await adminCreateFigure({ label: label.trim(), file });
      setLabel('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await reload();
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setFormError(apiError.response?.data?.message ?? 'Не удалось сохранить.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReplaceFile = async (fig: Figure, newFile: File) => {
    try {
      await adminUpdateFigure(fig.id, { file: newFile });
      await reload();
    } catch {
      alert('Не удалось заменить файл');
    }
  };

  const handleRename = async (fig: Figure, newLabel: string) => {
    if (newLabel === fig.label) return;
    try {
      await adminUpdateFigure(fig.id, { label: newLabel });
      await reload();
    } catch {
      alert('Не удалось переименовать');
    }
  };

  const handleToggle = async (fig: Figure) => {
    try {
      await adminToggleFigure(fig.id, !fig.active);
      await reload();
    } catch {
      alert('Не удалось переключить');
    }
  };

  const handleDelete = async (fig: Figure) => {
    if (!confirm(`Удалить фигурку «${fig.label}»?`)) return;
    try {
      await adminDeleteFigure(fig.id);
      await reload();
    } catch {
      alert('Не удалось удалить');
    }
  };

  const canSubmit = label.trim().length > 0 && !!file && !isSaving;

  return (
    <Container>
      <section className="py-10 md:py-16">

        {/* ───────── Заголовок ───────── */}
        <div className="mb-12 md:mb-16 max-w-3xl">
          <span className="kicker">Настройки платформы</span>
          <h1 className="mt-6 text-[clamp(2.5rem,6vw,5rem)] leading-[0.9] text-texture-bone">
            Шкаф фигурок
          </h1>
          <p className="mt-6 text-bone text-base md:text-lg leading-relaxed max-w-2xl">
            Фигурки, которые игроки видят в лобби. PNG загружается в S3,
            метаданные хранятся в базе. Игроки выбирают фигурку в шкафу.
          </p>
        </div>

        {/* ───────── Форма создания — на пергаменте ───────── */}
        <div className="relative max-w-4xl mb-16 md:mb-20">
          <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />

          <div className="paper paper-old p-7 md:p-10 relative">
            {/* Штамп в углу */}
            <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
              <span className="stamp-red text-xs">Новая</span>
            </div>

            <div className="flex items-baseline justify-between mb-7 pb-3
                            border-b border-ink-text/20">
              <span className="type text-[11px] uppercase tracking-[0.28em] text-ink-text-soft">
                Карточка фигурки
              </span>
              <span className="type text-[11px] uppercase tracking-[0.28em] text-blood">
                ● Добавление
              </span>
            </div>

            <form
              onSubmit={handleCreate}
              className="grid gap-7 md:grid-cols-[2fr_2fr_auto] md:items-end"
            >
              <label className="flex flex-col gap-2">
                <span className="type text-[11px] uppercase tracking-[0.24em] text-ink-text-dim">
                  Название <span className="text-blood">*</span>
                </span>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Сыщик"
                  maxLength={100}
                  className={INPUT_PAPER}
                />
              </label>

              <div className="flex flex-col gap-2">
                <span className="type text-[11px] uppercase tracking-[0.24em] text-ink-text-dim">
                  PNG <span className="text-blood">*</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={
                      'flex-1 flex items-center justify-center gap-2 ' +
                      'px-4 py-2 border-2 border-dashed transition-colors ' +
                      'type text-[12px] uppercase tracking-[0.2em] cursor-pointer ' +
                      (file
                        ? 'border-ink-text/40 text-ink-text hover:border-blood hover:text-blood'
                        : 'border-blood/50 text-blood hover:border-blood hover:bg-blood/5')
                    }
                  >
                    {file ? 'Заменить файл' : 'Выбрать PNG'}
                  </button>

                  {file && (
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="w-9 h-9 flex items-center justify-center
                                 text-ink-text-dim hover:text-blood
                                 type text-xl leading-none cursor-pointer"
                      title="Убрать файл"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {file && (
                  <span className="type text-[11px] text-ink-text-soft truncate">
                    {file.name}
                  </span>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className={
                  'h-[46px] px-8 transition-colors ' +
                  'type text-[12px] uppercase tracking-[0.26em] ' +
                  (canSubmit
                    ? 'bg-blood text-paper hover:bg-blood-hover cursor-pointer'
                    : 'bg-ink-text/15 text-ink-text/40 cursor-not-allowed')
                }
              >
                {isSaving ? '…' : 'Создать'}
              </button>
            </form>

            {formError && (
              <div className="mt-5 px-4 py-3 bg-blood/15 border-l-4 border-blood
                              type text-[13px] text-blood">
                {formError}
              </div>
            )}

            {!file && (
              <div className="mt-5 hand text-xl text-blood rotate-[-1deg]">
                без PNG фигурку не создать
              </div>
            )}
          </div>
        </div>

        {/* ───────── Список ───────── */}
        {isLoading && (
          <div className="type text-[14px] uppercase tracking-[0.28em] text-bone-muted py-8">
            Загружаем…
          </div>
        )}

        {error && (
          <div className="border border-blood/40 bg-blood/10 p-6 max-w-2xl">
            <div className="type text-[12px] uppercase tracking-[0.28em] text-blood mb-2">
              Ошибка
            </div>
            <div className="text-bone text-base">{error}</div>
          </div>
        )}

        {!isLoading && !error && figures.length === 0 && (
          <div className="border border-bone/20 p-10 max-w-2xl">
            <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted mb-3">
              Пока пусто
            </div>
            <div className="text-bone text-lg">
              Создайте первую фигурку через форму выше.
            </div>
          </div>
        )}

        {!isLoading && figures.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-bone/15">
              <span className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted">
                Всего: {figures.length}
              </span>
              <span className="type text-[13px] uppercase tracking-[0.28em] text-blood">
                ● Активных: {figures.filter((f) => f.active).length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {figures.map((fig) => (
                <FigureCard
                  key={fig.id}
                  figure={fig}
                  onReplaceFile={(f) => handleReplaceFile(fig, f)}
                  onRename={(l) => handleRename(fig, l)}
                  onToggle={() => handleToggle(fig)}
                  onDelete={() => handleDelete(fig)}
                />
              ))}
            </div>
          </>
        )}

      </section>
    </Container>
  );
}

/* ============================================================
   Карточка фигурки
   ============================================================ */

function FigureCard({
  figure,
  onReplaceFile,
  onRename,
  onToggle,
  onDelete,
}: {
  figure: Figure;
  onReplaceFile: (f: File) => void;
  onRename: (label: string) => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [labelDraft, setLabelDraft] = useState(figure.label);
  const fileInput = useRef<HTMLInputElement>(null);

  const saveLabel = () => {
    setEditing(false);
    if (labelDraft.trim() && labelDraft !== figure.label) {
      onRename(labelDraft.trim());
    }
  };

  const isHidden = !figure.active;

  return (
    <div className={'flex flex-col gap-5 transition-opacity ' + (isHidden ? 'opacity-70' : '')}>

      {/* Служебная строка: код + тоггл */}
      <div className="flex items-center justify-between">
        <span className="type text-[12px] uppercase tracking-[0.28em] text-bone-muted">
          {figure.code}
        </span>

        <button
          type="button"
          onClick={onToggle}
          title={figure.active ? 'Скрыть' : 'Показать'}
          className={
            'type text-[12px] uppercase tracking-[0.26em] transition-colors cursor-pointer ' +
            (figure.active
              ? 'text-blood hover:text-blood-hover'
              : 'text-bone-dim hover:text-bone-muted')
          }
        >
          {figure.active ? '● Активна' : '○ Скрыта'}
        </button>
      </div>

      {/* Превью */}
      <div className="relative w-full h-[280px] md:h-[320px]
                      flex items-center justify-center">

        <FigureImage
          code={figure.code}
          alt={figure.label}
          className={
            'w-full h-full transition-all ' +
            (isHidden ? 'grayscale opacity-40' : '')
          }
        />

        {/* Если скрыта — затемнение + штамп */}
        {isHidden && (
          <>
            <div className="absolute inset-0 bg-ink/40 pointer-events-none" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                            rotate-[-8deg] pointer-events-none">
              <span className="stamp-red text-base md:text-lg">Скрыта</span>
            </div>
          </>
        )}
      </div>

      {/* Имя */}
      {editing ? (
        <input
          value={labelDraft}
          onChange={(e) => setLabelDraft(e.target.value)}
          onBlur={saveLabel}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveLabel();
            if (e.key === 'Escape') {
              setEditing(false);
              setLabelDraft(figure.label);
            }
          }}
          autoFocus
          maxLength={100}
          className="bg-transparent border-b-2 border-blood px-0 py-2
                     text-bone font-poster text-3xl
                     focus:outline-none w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Кликните, чтобы переименовать"
          className={
            'text-left font-poster text-3xl md:text-4xl transition-colors ' +
            'cursor-pointer leading-tight truncate w-full ' +
            (isHidden
              ? 'text-bone-dim hover:text-bone-muted'
              : 'text-bone hover:text-blood')
          }
        >
          {figure.label}
        </button>
      )}

      {/* Действия */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="flex-1 px-4 py-2.5
                     border border-bone/25
                     type text-[12px] uppercase tracking-[0.24em]
                     text-bone-muted hover:text-bone hover:border-bone/60
                     transition-colors cursor-pointer"
        >
          Заменить PNG
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="px-4 py-2.5
                     border border-blood/40
                     type text-[12px] uppercase tracking-[0.24em]
                     text-blood hover:bg-blood hover:text-paper
                     transition-colors cursor-pointer"
        >
          Удалить
        </button>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onReplaceFile(f);
          if (fileInput.current) fileInput.current.value = '';
        }}
      />
    </div>
  );
}