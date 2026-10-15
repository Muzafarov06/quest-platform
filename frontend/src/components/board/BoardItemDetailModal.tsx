import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import type { BoardItem } from '../../types/board';

interface Props {
  item: BoardItem;
  evidenceMediaId: string | null;
  evidenceMeta?: {
    evidenceType?: string;
    importance?: string;
    contentText?: string | null;
  } | null;
  onDelete: () => void;
  onClose: () => void;
}

const IMPORTANCE_LABEL: Record<string, string> = {
  KEY: 'Ключевая',
  SUPPORTING: 'Подкрепляющая',
  RED_HERRING: 'Ложный след',
};

const IMPORTANCE_COLOR: Record<string, string> = {
  KEY: 'text-blood border-blood/60 bg-blood/10',
  SUPPORTING: 'text-brass border-brass/50 bg-brass/10',
  RED_HERRING: 'text-bone-muted border-bone/30 bg-ink/40',
};

export function BoardItemDetailModal({
  item,
  evidenceMediaId,
  evidenceMeta,
  onDelete,
  onClose,
}: Props) {
  const url = useMediaUrl(evidenceMediaId);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const importanceClass = evidenceMeta?.importance
    ? IMPORTANCE_COLOR[evidenceMeta.importance] ?? 'text-bone-muted border-bone/30 bg-ink/40'
    : '';
  const importanceLabel = evidenceMeta?.importance
    ? IMPORTANCE_LABEL[evidenceMeta.importance] ?? evidenceMeta.importance
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center
                 p-4 md:p-8 overflow-y-auto animate-fade-in"
      style={{ background: 'rgba(8,7,5,0.9)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="paper paper-old relative p-6 md:p-9 shadow-paper-lift">
          <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />
          <div className="pin brass" style={{ top: -8, right: 44, zIndex: 20 }} />

          <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
            <span className="stamp-red text-xs">Улика</span>
          </div>

          <div className="flex items-baseline justify-between gap-4 pb-3 mb-6
                          border-b border-dashed border-ink-text/25">
            <span className="type text-[11px] uppercase tracking-[0.28em] text-ink-text-soft">
              Материал дела
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

          <h2 className="font-poster text-3xl md:text-4xl leading-tight text-ink-text mb-6">
            {item.title ?? 'Без названия'}
          </h2>

          {url && (
            <div className="w-full mb-6 flex items-center justify-center">
              <img
                src={url}
                alt={item.title ?? ''}
                draggable={false}
                className="max-w-full max-h-[55vh] object-contain select-none"
                style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.45))' }}
              />
            </div>
          )}

          {item.content && (
            <p
              className="text-[15px] leading-relaxed whitespace-pre-line text-ink-text-soft mb-6"
              style={{ fontFamily: 'var(--font-type, monospace)' }}
            >
              {item.content}
            </p>
          )}

          {evidenceMeta?.contentText && evidenceMeta.contentText !== item.content && (
            <blockquote
              className="my-6 pl-5 py-2 whitespace-pre-line text-ink-text
                         border-l-2 border-blood/70 text-[15px] leading-[1.7]"
              style={{ fontFamily: 'var(--font-type, monospace)' }}
            >
              {evidenceMeta.contentText}
            </blockquote>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-4
                          border-t border-dashed border-ink-text/25">
            {importanceLabel && (
              <span
                className={
                  'type text-[10px] uppercase tracking-[0.22em] ' +
                  'px-2.5 py-1 border ' + importanceClass
                }
              >
                {importanceLabel}
              </span>
            )}
            {evidenceMeta?.evidenceType && (
              <span className="type text-[10px] uppercase tracking-[0.22em]
                               text-ink-text-dim">
                {evidenceMeta.evidenceType}
              </span>
            )}
            <span className="type text-[10px] uppercase tracking-[0.22em]
                             text-ink-text-dim ml-auto">
              нашёл: <span className="text-blood">{item.createdByName ?? '—'}</span>
            </span>
          </div>

          <div className="mt-6 flex gap-3 justify-between flex-wrap">
            <button
              type="button"
              onClick={onDelete}
              className="px-5 py-3 border border-blood/40 text-blood
                         type text-[11px] uppercase tracking-[0.24em]
                         hover:bg-blood/10 transition-colors cursor-pointer"
            >
              Убрать с доски
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-blood text-paper px-6 py-3
                         type text-[12px] uppercase tracking-[0.24em]
                         hover:bg-blood-hover transition-colors cursor-pointer"
            >
              Понятно
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}