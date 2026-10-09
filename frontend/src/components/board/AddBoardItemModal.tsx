import { useEffect, useState, type FormEvent } from 'react';
import { addBoardItem } from '../../api/board';
import { INPUT_PAPER } from '../ui/inputStyles';
import type { BoardItemType } from '../../types/board';

interface Props {
  sessionId: string;
  onAdded: () => void;
  onClose: () => void;
}

const TYPES: { key: BoardItemType; label: string; hint: string }[] = [
  { key: 'EVIDENCE', label: 'Улика', hint: 'Найденный предмет' },
  { key: 'NOTE', label: 'Заметка', hint: 'Мысль, деталь' },
  { key: 'HYPOTHESIS', label: 'Гипотеза', hint: 'Версия событий' },
  { key: 'QUESTION', label: 'Вопрос', hint: 'Что непонятно' },
];

export function AddBoardItemModal({ sessionId, onAdded, onClose }: Props) {
  const [itemType, setItemType] = useState<BoardItemType>('NOTE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await addBoardItem(sessionId, {
        itemType,
        title: title.trim() || undefined,
        content: content.trim() || undefined,
        posX: 300 + Math.random() * 1200,
        posY: 200 + Math.random() * 800,
      });
      onAdded();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message ?? 'Не удалось добавить');
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4
                 overflow-y-auto animate-fade-in"
      style={{ background: 'rgba(10,6,3,0.88)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg my-auto animate-rise-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="paper paper-old relative p-6 sm:p-8 shadow-paper-lift">
          <div className="pin" style={{ top: -7, left: '50%', marginLeft: -7 }} />

          <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
            <span className="stamp-red text-xs">Новая</span>
          </div>

          <div className="flex items-baseline justify-between gap-4 mb-6 pb-3
                          border-b border-dashed border-ink-text/25">
            <span className="type text-[11px] uppercase tracking-[0.28em] text-ink-text-soft">
              Карточка на доску
            </span>
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="w-8 h-8 flex items-center justify-center cursor-pointer
                         text-ink-text-soft hover:text-blood transition-colors"
            >
              ✕
            </button>
          </div>

          <h3 className="font-poster text-2xl sm:text-3xl leading-tight mb-2 text-ink-text">
            Что приколоть?
          </h3>
          <div className="hand text-lg text-blood rotate-[-1.5deg] mb-6">
            добавьте на общую доску
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Тип */}
            <div className="flex flex-col gap-2">
              <span className="type text-[10px] uppercase tracking-[0.24em] text-ink-text-dim">
                Тип
              </span>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((t) => {
                  const active = itemType === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setItemType(t.key)}
                      className={
                        'flex flex-col items-start gap-1 px-3 py-2.5 border-2 ' +
                        'transition-colors cursor-pointer text-left ' +
                        (active
                          ? 'border-blood bg-blood/[0.08]'
                          : 'border-ink-text/25 hover:border-ink-text/50')
                      }
                    >
                      <span
                        className={
                          'type text-[11px] uppercase tracking-[0.18em] ' +
                          (active ? 'text-blood' : 'text-ink-text')
                        }
                      >
                        {t.label}
                      </span>
                      <span className="type text-[9px] uppercase tracking-[0.16em] text-ink-text-dim">
                        {t.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Заголовок */}
            <label className="flex flex-col gap-2">
              <span className="type text-[10px] uppercase tracking-[0.24em] text-ink-text-dim">
                Заголовок
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="Что это?"
                className={INPUT_PAPER}
              />
            </label>

            {/* Содержимое */}
            <label className="flex flex-col gap-2">
              <span className="type text-[10px] uppercase tracking-[0.24em] text-ink-text-dim">
                Содержимое
              </span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Детали, выводы, цитаты…"
                className={INPUT_PAPER + ' resize-none'}
              />
            </label>

            {error && (
              <div className="px-3 py-2 border-l-4 border-blood bg-blood/[0.08]
                              type text-[13px] text-blood">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4
                            border-t border-dashed border-ink-text/25">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-ink-text/30
                           type text-[11px] uppercase tracking-[0.22em]
                           text-ink-text-soft hover:text-ink-text hover:border-ink-text/60
                           transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={busy || (!title.trim() && !content.trim())}
                className="px-6 py-2.5 border-2 border-blood bg-blood text-paper
                           type text-[11px] uppercase tracking-[0.24em]
                           hover:bg-blood-hover transition-colors cursor-pointer
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? 'Прикалываем…' : 'Приколоть'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}