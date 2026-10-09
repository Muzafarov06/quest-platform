import type { ReactNode } from 'react';

interface Props {
  /** Заголовок в шапке карточки. */
  title: string;
  /** Штамп в углу (например «Новая», «Правка»). Если не задан — без штампа. */
  stamp?: string;
  onClose: () => void;
  /** Если задан — показываем кнопки «Сохранить» и «Отмена». */
  onSave?: () => void | Promise<void>;
  saveLabel?: string;
  cancelLabel?: string;
  isSaving?: boolean;
  /** Блок ошибки над кнопками. */
  error?: string | null;
  children: ReactNode;
  /** Максимальная ширина (по умолчанию 2xl). */
  maxWidth?: string;
}

/**
 * Универсальная модалка-форма:
 * затемнение, пергамент, булавка, штамп, крестик, кнопки.
 */
export function AdminPaperModal({
  title,
  stamp,
  onClose,
  onSave,
  saveLabel = 'Сохранить',
  cancelLabel = 'Отмена',
  isSaving = false,
  error,
  children,
  maxWidth = 'max-w-2xl',
}: Props) {
  const hasFooter = !!onSave;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center
                 p-3 sm:p-6 bg-ink/85 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={
          'relative w-full my-auto ' + maxWidth
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (onSave && !isSaving) void onSave();
          }}
          className="paper paper-old p-6 md:p-8 relative flex flex-col gap-6"
        >
          {stamp && (
            <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
              <span className="stamp-red text-xs">{stamp}</span>
            </div>
          )}

          <div className="flex items-baseline justify-between pb-3
                          border-b border-ink-text/20">
            <span className="type text-[11px] uppercase tracking-[0.28em]
                             text-ink-text-soft">
              {title}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center
                         text-ink-text-dim hover:text-blood text-lg
                         transition-colors cursor-pointer"
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>

          {children}

          {error && (
            <div className="px-4 py-3 bg-blood/15 border-l-4 border-blood
                            type text-[13px] text-blood">
              {error}
            </div>
          )}

          {hasFooter && (
            <div className="flex gap-3 pt-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-6 py-3 border border-ink-text/40 text-ink-text
                           type text-[12px] uppercase tracking-[0.24em]
                           hover:border-ink-text/70 hover:bg-black/5
                           transition-colors cursor-pointer disabled:opacity-40"
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blood text-paper px-6 py-3
                           type text-[12px] uppercase tracking-[0.24em]
                           hover:bg-blood-hover transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? 'Сохраняем…' : saveLabel}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}