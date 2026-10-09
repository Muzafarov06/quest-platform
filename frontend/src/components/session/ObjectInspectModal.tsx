import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import type { InspectEvidenceItem, ObjectInspectResponse } from '../../types/inspect';

interface Props {
  data: ObjectInspectResponse;
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

export function ObjectInspectModal({ data, onClose }: Props) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center
                 p-4 md:p-8 overflow-y-auto animate-fade-in"
      style={{ background: 'rgba(8,7,5,0.88)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-auto animate-rise-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="paper paper-old relative p-6 md:p-9 shadow-paper-lift">
          <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />
          <div className="pin brass" style={{ top: -8, right: 44, zIndex: 20 }} />

          <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
            <span className="stamp-red text-xs">
              {data.evidences.length > 0 ? 'Улики' : 'Осмотр'}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-4 pb-3 mb-6
                          border-b border-dashed border-ink-text/25">
            <span className="type text-[11px] uppercase tracking-[0.28em] text-ink-text-soft">
              {data.objectType} · {data.objectState}
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

          <h2 className="font-poster text-3xl md:text-4xl leading-tight text-ink-text mb-4">
            {data.objectName}
          </h2>

          {data.objectDescription && (
            <p className="text-[15px] leading-relaxed whitespace-pre-line text-ink-text-soft mb-6">
              {data.objectDescription}
            </p>
          )}

          {data.evidences.length === 0 ? (
            <div className="mt-6 pt-6 border-t border-dashed border-ink-text/25
                            text-center">
              <div className="type text-[12px] uppercase tracking-[0.24em] text-ink-text-dim">
                Здесь больше ничего нет
              </div>
            </div>
          ) : (
            <div className="mt-2 pt-6 border-t border-dashed border-ink-text/25">
              <div className="type text-[10px] uppercase tracking-[0.3em] text-blood mb-4">
                Улики · {data.evidences.length}
              </div>
              <div className="flex flex-col gap-4">
                {data.evidences.map((e) => (
                  <EvidenceCard key={e.evidenceId} item={e} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-dashed border-ink-text/25
                          flex items-center justify-between gap-4 flex-wrap">
            <span className="hand text-lg text-blood/90 rotate-[-1deg]">
              улики в портфеле
            </span>
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

/* ============================================================ */

function EvidenceCard({ item }: { item: InspectEvidenceItem }) {
  const url = useMediaUrl(item.mediaId);
  const importanceClass =
    IMPORTANCE_COLOR[item.importance] ?? 'text-bone-muted border-bone/30 bg-ink/40';
  const importanceLabel =
    IMPORTANCE_LABEL[item.importance] ?? item.importance;

  const takenByOther = !!item.discoveredByPlayerName;

  return (
    <div className="relative border border-ink-text/20 bg-black/[0.04] p-4">
      {/* Крупная плашка «кто взял улику» — на всю ширину карточки. */}
      {takenByOther && (
        <div className="mb-4 -mt-1 flex items-center gap-3
                        px-3.5 py-2.5
                        bg-brass/15 border-l-4 border-brass/70">
          <span className="shrink-0 text-2xl leading-none" aria-hidden="true">
            🖐
          </span>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="type text-[10px] uppercase tracking-[0.28em]
                             text-ink-text-dim">
              Улику первым нашёл
            </span>
            <span className="font-poster text-[18px] text-ink-text truncate
                             mt-0.5">
              {item.discoveredByPlayerName}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        {url ? (
          <div className="w-24 h-24 shrink-0 flex items-center justify-center">
            <img
              src={url}
              alt={item.title}
              draggable={false}
              className="max-w-full max-h-full object-contain select-none"
            />
          </div>
        ) : (
          <div className="w-24 h-24 shrink-0 flex items-center justify-center
                          border border-dashed border-ink-text/25
                          type text-[9px] uppercase tracking-[0.2em]
                          text-ink-text-dim text-center px-1">
            нет фото
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap mb-1.5">
            <span className="font-poster text-[16px] leading-tight text-ink-text">
              {item.title}
            </span>
            <span
              className={
                'type text-[9px] uppercase tracking-[0.22em] ' +
                'px-2 py-0.5 border ' + importanceClass
              }
            >
              {importanceLabel}
            </span>
          </div>

          {item.description && (
            <p className="text-[13px] text-ink-text-soft leading-snug mb-2">
              {item.description}
            </p>
          )}

          {item.contentText && (
            <div
              className="mt-2 pl-3 py-1 border-l-2 border-blood/60
                         text-ink-text text-[13px] leading-relaxed
                         whitespace-pre-line"
              style={{ fontFamily: 'var(--font-type, monospace)' }}
            >
              {item.contentText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}