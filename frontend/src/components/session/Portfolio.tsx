import { useCallback, useEffect, useMemo, useState } from 'react';
import { addBoardItem, getBoardItems } from '../../api/board';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import type { Evidence, EvidenceImportance, EvidenceType } from '../../types/evidence';

interface Props {
  sessionId: string;
  evidences: Evidence[];
  onClose: () => void;
  // onRefresh: () => void;  // ← ИСПРАВЛЕНО: удалено, не использовалось
}

type FilterKey =
  | 'ALL' | 'KEY' | 'SUPPORTING' | 'RED_HERRING'
  | 'DOCUMENT' | 'PHOTO' | 'DIGITAL' | 'PHYSICAL' | 'TESTIMONY';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL',        label: 'Все' },
  { key: 'KEY',        label: 'Ключевые' },
  { key: 'SUPPORTING', label: 'Подкрепляющие' },
  { key: 'RED_HERRING',label: 'Ложные' },
  { key: 'DOCUMENT',   label: 'Документы' },
  { key: 'PHOTO',      label: 'Фото' },
  { key: 'DIGITAL',    label: 'Цифровые' },
  { key: 'PHYSICAL',   label: 'Физические' },
  { key: 'TESTIMONY',  label: 'Показания' },
];

const IMPORTANCE_LABEL: Record<EvidenceImportance, string> = {
  KEY: 'Ключевая',
  SUPPORTING: 'Подкрепляющая',
  RED_HERRING: 'Ложный след',
};

const TYPE_LABEL: Record<EvidenceType, string> = {
  DOCUMENT: 'Документ',
  PHOTO: 'Фотография',
  AUDIO: 'Аудиозапись',
  VIDEO: 'Видеозапись',
  PHYSICAL: 'Физический объект',
  DIGITAL: 'Цифровой след',
  TESTIMONY: 'Показания',
  OTHER: 'Прочее',
};

/**
 * Портфель следователя — папка с материалами дела.
 */
// ← ИСПРАВЛЕНО: убран onRefresh из деструктуризации
export function Portfolio({ sessionId, evidences, onClose }: Props) {
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [openEvidence, setOpenEvidence] = useState<Evidence | null>(null);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [boardEvidenceIds, setBoardEvidenceIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getBoardItems(sessionId)
      .then((items) => {
        const ids = new Set<string>();
        items.forEach((it) => {
          if (it.itemType === 'EVIDENCE' && it.evidenceId) ids.add(it.evidenceId);
        });
        setBoardEvidenceIds(ids);
      })
      .catch(() => { /* ignore */ });
  }, [sessionId]);

  const showToast = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return evidences;
    if (filter === 'KEY' || filter === 'SUPPORTING' || filter === 'RED_HERRING') {
      return evidences.filter((e) => e.importance === filter);
    }
    return evidences.filter((e) => e.evidenceType === filter);
  }, [evidences, filter]);

  const counts = useMemo(() => {
    const c = { total: evidences.length, key: 0, onBoard: 0 };
    evidences.forEach((e) => {
      if (e.importance === 'KEY') c.key++;
      if (boardEvidenceIds.has(e.id)) c.onBoard++;
    });
    return c;
  }, [evidences, boardEvidenceIds]);

  const handleSendToBoard = async (e: Evidence) => {
    if (busyId) return;
    if (boardEvidenceIds.has(e.id)) {
      showToast('Улика уже на доске');
      return;
    }
    setBusyId(e.id);
    try {
      await addBoardItem(sessionId, {
        itemType: 'EVIDENCE',
        evidenceId: e.id,
        title: e.title,
        content: e.contentText ?? e.description ?? undefined,
        posX: 40 + Math.random() * 200,
        posY: 40 + Math.random() * 160,
      });
      setBoardEvidenceIds((prev) => new Set(prev).add(e.id));
      showToast('Улика приколота к доске');
    } catch (err) {
      const apiError = err as { response?: { status?: number; data?: { message?: string } } };
      if (apiError.response?.status === 409) {
        setBoardEvidenceIds((prev) => new Set(prev).add(e.id));
        showToast('Улика уже на доске');
      } else {
        showToast(apiError.response?.data?.message ?? 'Не удалось отправить');
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveNote = async (title: string, content: string) => {
    try {
      await addBoardItem(sessionId, {
        itemType: 'NOTE',
        title: title || 'Заметка',
        content: content || undefined,
        posX: 40 + Math.random() * 200,
        posY: 40 + Math.random() * 160,
      });
      setNoteFormOpen(false);
      showToast('Заметка на доске');
    } catch {
      showToast('Не удалось добавить заметку');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
      style={{ background: 'rgba(10,6,3,0.9)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl my-auto animate-rise-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="paper paper-old relative shadow-paper-lift">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blood/70 to-transparent" />

          <header className="relative px-6 sm:px-8 pt-7 pb-5">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="min-w-0">
                <span className="kicker text-[11px]">Портфель следователя</span>
                <h2 className="mt-3 font-poster text-3xl sm:text-4xl leading-[0.95] text-texture-ink">
                  Личные материалы
                </h2>
                <div className="mt-3 hand text-xl text-blood rotate-[-1.5deg]">
                  всё, что удалось собрать
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="hidden sm:flex items-start gap-5">
                  <Stat label="Улик" value={counts.total} />
                  <Stat label="Ключевых" value={counts.key} accent />
                  <Stat label="На доске" value={counts.onBoard} />
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть портфель"
                  className="shrink-0 w-9 h-9 flex items-center justify-center
                             border border-ink-text/25 text-ink-text-soft
                             hover:text-blood hover:border-blood/50
                             transition-colors cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="1.6" className="w-4 h-4">
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          <div className="relative px-6 sm:px-8 pb-4 flex items-center gap-2 flex-wrap
                          border-b border-dashed border-ink-text/25">
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={
                      'type text-[10px] uppercase tracking-[0.18em] ' +
                      'px-3 py-1.5 border transition-colors cursor-pointer ' +
                      (active
                        ? 'border-blood text-blood bg-blood/[0.06]'
                        : 'border-ink-text/20 text-ink-text-soft hover:text-ink-text hover:border-ink-text/40')
                    }
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setNoteFormOpen(true)}
              className="shrink-0 inline-flex items-center gap-2
                         px-4 py-2 border border-blood/60 bg-blood/[0.06]
                         text-blood type text-[10px] uppercase tracking-[0.22em]
                         hover:bg-blood/[0.12] transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.6" className="w-3.5 h-3.5">
                <path d="M4 20 L4 6 a2 2 0 0 1 2 -2 h10 l4 4 v12 a2 2 0 0 1 -2 2 z" />
                <line x1="8" y1="11" x2="16" y2="11" />
                <line x1="8" y1="15" x2="13" y2="15" />
              </svg>
              Заметка
            </button>
          </div>

          <div className="relative px-6 sm:px-8 py-6 min-h-[400px] max-h-[68vh] overflow-y-auto scroll-map">
            {evidences.length === 0 ? (
              <EmptyState />
            ) : filtered.length === 0 ? (
              <NoMatchState />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((e, idx) => (
                  <EvidenceCard
                    key={e.id}
                    evidence={e}
                    index={idx + 1}
                    onBoard={boardEvidenceIds.has(e.id)}
                    busy={busyId === e.id}
                    onSend={() => handleSendToBoard(e)}
                    onOpen={() => setOpenEvidence(e)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {openEvidence && (
        <EvidenceDetail
          evidence={openEvidence}
          onBoard={boardEvidenceIds.has(openEvidence.id)}
          busy={busyId === openEvidence.id}
          onSend={async () => { await handleSendToBoard(openEvidence); }}
          onClose={() => setOpenEvidence(null)}
        />
      )}

      {noteFormOpen && (
        <QuickNoteModal
          onSave={handleSaveNote}
          onClose={() => setNoteFormOpen(false)}
        />
      )}

      {toast && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300]
                     px-5 py-3 paper paper-fresh
                     type text-[11px] uppercase tracking-[0.22em] text-ink-text
                     animate-fade-in"
          style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.7)' }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Карточка улики
   ============================================================ */

function EvidenceCard({
  evidence,
  index,
  onBoard,
  busy,
  onSend,
  onOpen,
}: {
  evidence: Evidence;
  index: number;
  onBoard: boolean;
  busy: boolean;
  onSend: () => void;
  onOpen: () => void;
}) {
  const url = useMediaUrl(evidence.mediaId);

  return (
    <div
      className="relative paper paper-fresh p-4 lift cursor-pointer"
      onClick={onOpen}
    >
      <div
        className={'pin' + (evidence.importance === 'KEY' ? ' brass' : '')}
        style={{ top: -6, left: '50%', marginLeft: -7 }}
      />

      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="type text-[10px] tracking-[0.22em] text-ink-text-dim">
          № {String(index).padStart(2, '0')}
        </span>
        <span
          className={
            'stamp-red text-[9px] ' +
            (evidence.importance === 'RED_HERRING' ? 'opacity-50' : '')
          }
        >
          {IMPORTANCE_LABEL[evidence.importance]}
        </span>
      </div>

      {/* Превью улики: object-contain, без обрезки, без фона-плашки. */}
      <div className="relative w-full aspect-[4/3] mb-3 flex items-center justify-center">
        {url ? (
          <img
            src={url}
            alt={evidence.title}
            draggable={false}
            className="max-w-full max-h-full object-contain select-none"
            style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-text-dim/50">
            <EvidenceTypeIcon type={evidence.evidenceType} className="w-10 h-10" />
          </div>
        )}

        <div className="absolute bottom-0 left-0 px-2 py-1 bg-ink-text/85 text-bone
                        type text-[9px] uppercase tracking-[0.2em]">
          {TYPE_LABEL[evidence.evidenceType]}
        </div>
      </div>

      <h4 className="font-poster text-[17px] leading-tight text-ink-text mb-2 line-clamp-2">
        {evidence.title}
      </h4>

      {(evidence.description || evidence.contentText) && (
        <p className="text-[13px] leading-snug text-ink-text-soft line-clamp-2 mb-4">
          {evidence.description ?? evidence.contentText}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 pt-3 border-t border-dashed border-ink-text/20">
        <button
          type="button"
          onClick={(ev) => { ev.stopPropagation(); onSend(); }}
          disabled={busy || onBoard}
          className={
            'flex-1 inline-flex items-center justify-center gap-1.5 ' +
            'px-2 py-1.5 border type text-[10px] uppercase tracking-[0.18em] ' +
            'transition-colors cursor-pointer ' +
            (onBoard
              ? 'border-ink-text/30 text-ink-text-dim cursor-default'
              : busy
              ? 'border-blood/30 text-blood/50 cursor-wait'
              : 'border-blood/60 text-blood hover:bg-blood hover:text-bone')
          }
        >
          {onBoard ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.4" className="w-3 h-3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              На доске
            </>
          ) : busy ? (
            '…'
          ) : (
            <>
              <PinIcon className="w-3 h-3" />
              На доску
            </>
          )}
        </button>

        <button
          type="button"
          onClick={(ev) => { ev.stopPropagation(); onOpen(); }}
          title="Открыть"
          className="w-8 h-8 flex items-center justify-center
                     border border-ink-text/25 text-ink-text-soft
                     hover:text-blood hover:border-blood/50
                     transition-colors cursor-pointer"
        >
          <EyeIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Детальный просмотр улики
   ============================================================ */

function EvidenceDetail({
  evidence,
  onBoard,
  busy,
  onSend,
  onClose,
}: {
  evidence: Evidence;
  onBoard: boolean;
  busy: boolean;
  onSend: () => void | Promise<void>;
  onClose: () => void;
}) {
  const url = useMediaUrl(evidence.mediaId);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      style={{ background: 'rgba(10,6,3,0.9)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-auto animate-rise-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="paper paper-fresh relative p-6 sm:p-10 shadow-paper-lift">
          <div className="pin brass" style={{ top: -7, left: 32 }} />

          <div className="absolute -top-3 right-6 rotate-[5deg]">
            <span className="stamp-red text-[11px] tracking-[0.18em]">
              {IMPORTANCE_LABEL[evidence.importance]}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-4 mb-6 pb-3
                          border-b border-dashed border-ink-text/25">
            <span className="type text-[11px] uppercase tracking-[0.28em] text-ink-text-soft">
              {TYPE_LABEL[evidence.evidenceType]}
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

          <h2 className="font-poster text-3xl sm:text-4xl leading-tight mb-6 text-ink-text">
            {evidence.title}
          </h2>

          {url && (
            <div className="w-full mb-6 flex items-center justify-center">
              <img
                src={url}
                alt={evidence.title}
                draggable={false}
                className="max-w-full max-h-[60vh] object-contain select-none"
                style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.45))' }}
              />
            </div>
          )}

          {evidence.description && (
            <p className="text-[15px] leading-relaxed mb-4 whitespace-pre-line text-ink-text-soft">
              {evidence.description}
            </p>
          )}

          {evidence.contentText && (
            <blockquote
              className="my-6 pl-5 py-2 whitespace-pre-line italic
                         text-ink-text border-l-2 border-blood/70
                         text-[15px] leading-[1.7]"
              style={{ fontFamily: 'var(--font-type, monospace)' }}
            >
              {evidence.contentText}
            </blockquote>
          )}

          <div className="mt-8 pt-6 border-t border-dashed border-ink-text/25">
            <button
              type="button"
              onClick={onSend}
              disabled={busy || onBoard}
              className={
                'w-full sm:w-auto inline-flex items-center justify-center gap-2 ' +
                'px-6 py-3 border-2 type text-[12px] uppercase tracking-[0.24em] ' +
                'transition-colors cursor-pointer ' +
                (onBoard
                  ? 'border-ink-text/30 text-ink-text-dim cursor-default'
                  : busy
                  ? 'border-blood/30 text-blood/50 cursor-wait'
                  : 'border-blood text-blood hover:bg-blood hover:text-bone')
              }
            >
              {onBoard ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2.4" className="w-4 h-4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Уже приколота к доске
                </>
              ) : busy ? (
                'Отправляем…'
              ) : (
                <>
                  <PinIcon className="w-4 h-4" />
                  Приколоть к доске
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Быстрая заметка
   ============================================================ */

function QuickNoteModal({
  onSave,
  onClose,
}: {
  onSave: (title: string, content: string) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setBusy(true);
    try {
      await onSave(title.trim(), content.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(10,6,3,0.9)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg animate-rise-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="paper paper-fresh relative p-6 sm:p-8 shadow-paper-lift">
          <div className="pin" style={{ top: -7, left: '50%', marginLeft: -7 }} />

          <div className="flex items-baseline justify-between gap-4 mb-6 pb-3
                          border-b border-dashed border-ink-text/25">
            <span className="type text-[11px] uppercase tracking-[0.28em] text-ink-text-soft">
              Быстрая заметка
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

          <h3 className="font-poster text-2xl sm:text-3xl leading-tight mb-6 text-ink-text">
            Что записать?
          </h3>

          <div className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="type text-[10px] uppercase tracking-[0.24em] text-ink-text-soft">
                Заголовок
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                maxLength={200}
                placeholder="Алиби Тома не сходится…"
                className="px-0 py-2 bg-transparent border-b-2 border-ink-text/30
                           focus:border-blood focus:outline-none
                           text-ink-text text-lg"
                style={{ fontFamily: 'var(--font-type, monospace)' }}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="type text-[10px] uppercase tracking-[0.24em] text-ink-text-soft">
                Текст
              </span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="По вторникам охранник уходит за дочерью в 13:00…"
                className="px-0 py-2 bg-transparent border-b-2 border-ink-text/30
                           focus:border-blood focus:outline-none resize-none
                           text-ink-text text-base"
                style={{ fontFamily: 'var(--font-type, monospace)' }}
              />
            </label>
          </div>

          <div className="mt-8 pt-6 flex gap-3 justify-end
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
              type="button"
              onClick={handleSave}
              disabled={busy || (!title.trim() && !content.trim())}
              className="px-6 py-2.5 border-2 border-blood bg-blood text-bone
                         type text-[11px] uppercase tracking-[0.24em]
                         hover:bg-blood-hover transition-colors cursor-pointer
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? 'Прикалываем…' : 'На доску'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Мелкие компоненты
   ============================================================ */

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-end leading-none">
      <span className="type text-[9px] uppercase tracking-[0.26em] text-ink-text-dim">
        {label}
      </span>
      <span
        className={
          'font-poster text-3xl tabular-nums mt-1 ' +
          (accent ? 'text-blood' : 'text-ink-text')
        }
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] text-center px-4">
      <div className="w-20 h-20 mb-5 flex items-center justify-center
                      border-2 border-dashed border-ink-text/25 text-ink-text-dim">
        <BriefcaseIcon className="w-9 h-9" />
      </div>
      <div className="font-poster text-2xl text-ink-text mb-2">
        Портфель пуст
      </div>
      <p className="type text-[11px] uppercase tracking-[0.22em]
                    text-ink-text-dim max-w-sm leading-relaxed">
        Осматривайте объекты, читайте документы<br />
        и складывайте улики в портфель
      </p>
    </div>
  );
}

function NoMatchState() {
  return (
    <div className="flex items-center justify-center min-h-[320px]">
      <div className="type text-[11px] uppercase tracking-[0.24em] text-ink-text-dim">
        Нет улик с такими параметрами
      </div>
    </div>
  );
}

/* ============================================================
   Иконки
   ============================================================ */

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
         className={className} aria-hidden="true">
      <path d="M9 7 V5.5 a2 2 0 0 1 2 -2 h2 a2 2 0 0 1 2 2 V7" />
      <rect x="3" y="7" width="18" height="13" rx="1" />
      <line x1="3" y1="13.6" x2="21" y2="13.6" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
         className={className} aria-hidden="true">
      <circle cx="12" cy="9" r="4" />
      <line x1="12" y1="13" x2="12" y2="21" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
         className={className} aria-hidden="true">
      <path d="M2 12 a10 10 0 0 1 20 0 a10 10 0 0 1 -20 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EvidenceTypeIcon({
  type,
  className,
}: {
  type: EvidenceType;
  className?: string;
}) {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };

  switch (type) {
    case 'DOCUMENT':
      return (
        <svg {...props}>
          <path d="M4 20 V6 a2 2 0 0 1 2 -2 h10 l4 4 v12 a2 2 0 0 1 -2 2 z" />
          <line x1="8" y1="11" x2="16" y2="11" />
          <line x1="8" y1="15" x2="13" y2="15" />
        </svg>
      );
    case 'PHOTO':
      return (
        <svg {...props}>
          <rect x="3" y="6" width="18" height="14" rx="1" />
          <circle cx="8.5" cy="11" r="1.5" />
          <path d="M3 17 L9 13 L15 17 L18 15 L21 17" />
        </svg>
      );
    case 'AUDIO':
      return (
        <svg {...props}>
          <path d="M4 12 v0 M8 9 v6 M12 6 v12 M16 9 v6 M20 12 v0" />
        </svg>
      );
    case 'VIDEO':
      return (
        <svg {...props}>
          <rect x="3" y="7" width="13" height="10" rx="1" />
          <path d="M16 12 L21 9 V15 Z" />
        </svg>
      );
    case 'PHYSICAL':
      return (
        <svg {...props}>
          <path d="M6 6 L18 18 M6 18 L18 6" />
        </svg>
      );
    case 'DIGITAL':
      return (
        <svg {...props}>
          <rect x="4" y="6" width="16" height="12" rx="1" />
          <path d="M8 20 h8 M12 18 v2" />
        </svg>
      );
    case 'TESTIMONY':
      return (
        <svg {...props}>
          <path d="M4 6 h16 v10 h-4 l-4 4 v-4 h-8 z" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}