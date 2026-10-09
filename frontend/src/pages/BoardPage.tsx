import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getBoardItems,
  getBoardConnections,
  deleteBoardItem,
} from '../api/board';
import { getSession } from '../api/sessions';
import { useBoardSocket } from '../hooks/useBoardSocket';
import { MapPanContainer } from '../components/admin/map/MapPanContainer';
import {
  BoardCard,
  CARD_WIDTH,
  CARD_HEIGHT,
} from '../components/board/BoardCard';
import { getEvidencesByCase } from '../api/evidences';
import { useMediaUrl } from '../hooks/useMediaUrl';
import { AddBoardItemModal } from '../components/board/AddBoardItemModal';
import type {
  BoardItem,
  BoardConnection,
  BoardItemType,
} from '../types/board';
import type { GameSession } from '../types/session';
import type { ApiErrorResponse } from '../types/api';

const CANVAS_W = 3200;
const CANVAS_H = 2000;

type FilterKey = 'ALL' | BoardItemType;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'Всё' },
  { key: 'EVIDENCE', label: 'Улики' },
  { key: 'NOTE', label: 'Заметки' },
  { key: 'HYPOTHESIS', label: 'Гипотезы' },
  { key: 'QUESTION', label: 'Вопросы' },
];

export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<GameSession | null>(null);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [connections, setConnections] = useState<BoardConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* evidenceId → mediaId. Нужно, чтобы на карточках улик
     отображалась картинка. */
  const [evidenceMediaMap, setEvidenceMediaMap] = useState<Map<string, string | null>>(
    new Map()
  );

  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<BoardItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [localPositions, setLocalPositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());

  const showToast = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const reload = useCallback(async () => {
    if (!id) return;
    try {
      const [s, list, conns] = await Promise.all([
        getSession(id),
        getBoardItems(id),
        getBoardConnections(id).catch(() => [] as BoardConnection[]),
      ]);
      setSession(s);
      setItems(list);
      setConnections(conns);

      /* Загружаем улики кейса и строим карту evidenceId → mediaId. */
      try {
        const evidences = await getEvidencesByCase(s.caseId);
        const m = new Map<string, string | null>();
        evidences.forEach((ev) => {
          m.set(ev.id, ev.mediaId);
        });
        setEvidenceMediaMap(m);
      } catch {
        /* ignore — картинок просто не будет */
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось загрузить доску.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setIsLoading(true);
    void reload();
  }, [reload]);

  useBoardSocket(session?.id ?? id ?? null, reload);

  const handleDelete = async (itemId: string) => {
    if (!id) return;
    if (!confirm('Убрать карточку с доски?')) return;
    try {
      await deleteBoardItem(id, itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      showToast('Карточка убрана');
    } catch {
      showToast('Не удалось удалить карточку');
    }
  };

  const positions = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    items.forEach((it) => {
      const local = localPositions.get(it.id);
      m.set(it.id, local ?? { x: it.posX, y: it.posY });
    });
    return m;
  }, [items, localPositions]);

  const handlePositionChange = (itemId: string, x: number, y: number) => {
    setLocalPositions((prev) => {
      const next = new Map(prev);
      next.set(itemId, { x, y });
      return next;
    });
  };

  const visibleItems = useMemo(() => {
    if (filter === 'ALL') return items;
    return items.filter((i) => i.itemType === filter);
  }, [items, filter]);

  const visibleIds = useMemo(
    () => new Set(visibleItems.map((i) => i.id)),
    [visibleItems]
  );

  const counts = useMemo(() => {
    const c = { total: items.length, evidence: 0, note: 0, hyp: 0 };
    items.forEach((i) => {
      if (i.itemType === 'EVIDENCE') c.evidence++;
      else if (i.itemType === 'NOTE') c.note++;
      else if (i.itemType === 'HYPOTHESIS') c.hyp++;
    });
    return c;
  }, [items]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-ink flex items-center justify-center">
        <span className="type text-[13px] uppercase tracking-[0.32em] text-bone-muted">
          Раскладываем материалы…
        </span>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="fixed inset-0 bg-ink flex items-center justify-center p-6">
        <div className="paper paper-fresh p-8 max-w-lg border-l-4 border-blood">
          <div className="type text-[11px] uppercase tracking-[0.28em] text-blood mb-3">
            Ошибка
          </div>
          <div className="text-ink-text text-base mb-6">
            {error ?? 'Доска недоступна.'}
          </div>
          <button
            onClick={() => navigate(`/sessions/${id}/play`)}
            className="type text-[12px] uppercase tracking-[0.24em]
                       text-blood hover:text-blood-hover cursor-pointer"
          >
            ← В игру
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-ink overflow-hidden">
      <MapPanContainer
        width={CANVAS_W}
        height={CANVAS_H}
        disabled={false}
        zoom={zoom}
        onZoomChange={setZoom}
        contentRef={contentRef}
        fitMinZoomToViewport
        className="w-full h-full"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url('/images/detective-board.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 35%',
            opacity: 0.42,
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 50% 40% at 25% 25%, rgba(240,200,90,0.14), transparent 65%),
              radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, rgba(0,0,0,0.92) 100%)
            `,
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 18%, rgba(201,162,74,0.12) 0px, transparent 2px),' +
              'radial-gradient(circle at 34% 42%, rgba(201,162,74,0.10) 0px, transparent 2px),' +
              'radial-gradient(circle at 56% 28%, rgba(201,162,74,0.12) 0px, transparent 2px),' +
              'radial-gradient(circle at 78% 62%, rgba(201,162,74,0.10) 0px, transparent 2px),' +
              'radial-gradient(circle at 22% 82%, rgba(201,162,74,0.12) 0px, transparent 2px),' +
              'radial-gradient(circle at 66% 88%, rgba(201,162,74,0.08) 0px, transparent 2px)',
            backgroundSize: '180px 180px',
          }}
        />

        <svg
          className="absolute inset-0 pointer-events-none"
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ zIndex: 10 }}
        >
          <defs>
            <filter id="thread-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.7" />
            </filter>
          </defs>

          {connections.map((c) => {
            if (!visibleIds.has(c.fromItemId) || !visibleIds.has(c.toItemId)) return null;
            const a = positions.get(c.fromItemId);
            const b = positions.get(c.toItemId);
            if (!a || !b) return null;

            const aType = items.find((i) => i.id === c.fromItemId)?.itemType;
            const bType = items.find((i) => i.id === c.toItemId)?.itemType;
            const aH = aType ? CARD_HEIGHT[aType] : 200;
            const bH = bType ? CARD_HEIGHT[bType] : 200;

            const ax = a.x + CARD_WIDTH / 2;
            const ay = a.y + aH / 2;
            const bx = b.x + CARD_WIDTH / 2;
            const by = b.y + bH / 2;

            return (
              <line
                key={c.id}
                x1={ax}
                y1={ay}
                x2={bx}
                y2={by}
                stroke="rgba(156,28,28,0.72)"
                strokeWidth="1.6"
                strokeDasharray="4 3"
                filter="url(#thread-shadow)"
              />
            );
          })}
        </svg>

        <div className="absolute inset-0" style={{ zIndex: 20 }}>
          {visibleItems.map((item) => (
            <BoardCard
              key={item.id}
              item={{
                ...item,
                posX: positions.get(item.id)?.x ?? item.posX,
                posY: positions.get(item.id)?.y ?? item.posY,
              }}
              evidenceMediaId={
                item.evidenceId
                  ? evidenceMediaMap.get(item.evidenceId) ?? null
                  : null
              }
              zoom={zoom}
              selected={selectedId === item.id}
              onSelect={setSelectedId}
              onOpen={setOpenItem}
              onDelete={handleDelete}
              onPositionChange={handlePositionChange}
            />
          ))}
        </div>
      </MapPanContainer>

      <header className="absolute top-0 inset-x-0 z-[100] px-4 sm:px-6 py-4 pointer-events-none">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between gap-4 flex-wrap">
          <div className="pointer-events-auto flex items-center gap-3 flex-wrap">
            <Link
              to={`/sessions/${session.id}/play`}
              className="inline-flex items-center gap-2
                         px-4 py-2.5 border-2 border-brass/50
                         bg-ink/90 backdrop-blur-sm
                         type text-[11px] uppercase tracking-[0.24em] text-brass
                         hover:bg-brass/10 transition-colors"
              style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.7)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.8" className="w-3.5 h-3.5">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              В игру
            </Link>

            <div
              className="hidden sm:flex items-center gap-3
                         px-4 py-2.5 bg-ink/90 backdrop-blur-sm
                         border border-brass/40"
              style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.7)' }}
            >
              <span className="type text-[10px] uppercase tracking-[0.3em] text-brass/80">
                Доска расследования
              </span>
              <span className="text-bone-dim/40">·</span>
              <span className="font-mono text-[12px] tracking-[0.2em] text-bone">
                {session.roomCode}
              </span>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2 flex-wrap">
            <StatPill label="Всего" value={counts.total} />
            <StatPill label="Улик" value={counts.evidence} accent />
            <StatPill label="Заметок" value={counts.note} />
            <StatPill label="Гипотез" value={counts.hyp} />
          </div>
        </div>
      </header>

      <div
        className="absolute bottom-5 left-4 sm:left-6 z-[100]
                   flex flex-wrap gap-2 max-w-[55vw]"
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={
                'type text-[10px] uppercase tracking-[0.24em] ' +
                'px-3.5 py-2 border-2 transition-colors cursor-pointer ' +
                (active
                  ? 'border-blood bg-blood/15 text-blood'
                  : 'border-brass/40 bg-ink/90 backdrop-blur-sm text-bone-muted hover:text-bone hover:border-brass/70')
              }
              style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.7)' }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[100]
                   inline-flex items-center gap-3
                   bg-blood text-paper px-7 py-3.5
                   border-2 border-brass/60
                   type text-[12px] uppercase tracking-[0.3em]
                   hover:bg-blood-hover transition-colors cursor-pointer"
        style={{
          boxShadow:
            '0 14px 40px rgba(0,0,0,0.9), 0 0 28px rgba(156,28,28,0.38)',
        }}
      >
        <PinIcon className="w-5 h-5" />
        Приколоть
      </button>

      {openItem && (
        <BoardItemDetail
          item={openItem}
          evidenceMediaId={
            openItem.evidenceId
              ? evidenceMediaMap.get(openItem.evidenceId) ?? null
              : null
          }
          onDelete={() => {
            handleDelete(openItem.id);
            setOpenItem(null);
          }}
          onClose={() => setOpenItem(null)}
        />
      )}

      {addOpen && (
        <AddBoardItemModal
          sessionId={session.id}
          onClose={() => setAddOpen(false)}
          onAdded={() => {
            setAddOpen(false);
            void reload();
            showToast('Карточка приколота');
          }}
        />
      )}

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300]
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

/* ═══════════════════════════════════════════════════════════
   Детальный просмотр карточки
   ═══════════════════════════════════════════════════════════ */

function BoardItemDetail({
  item,
  evidenceMediaId,
  onDelete,
  onClose,
}: {
  item: BoardItem;
  evidenceMediaId: string | null;
  onDelete: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const typeLabel: Record<BoardItemType, string> = {
    EVIDENCE: 'Улика',
    NOTE: 'Заметка',
    HYPOTHESIS: 'Гипотеза',
    QUESTION: 'Вопрос',
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4
                 overflow-y-auto animate-fade-in"
      style={{ background: 'rgba(10,6,3,0.88)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-auto animate-rise-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="paper paper-old relative p-6 sm:p-8 shadow-paper-lift">
          <div className="pin" style={{ top: -7, left: 32 }} />

          <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
            <span className="stamp-red text-xs">{typeLabel[item.itemType]}</span>
          </div>

          <div className="flex items-baseline justify-between gap-4 mb-6 pb-3
                          border-b border-dashed border-ink-text/25">
            <span className="type text-[11px] uppercase tracking-[0.28em] text-ink-text-soft">
              Карточка дела
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

          {item.title && (
            <h2 className="font-poster text-3xl leading-tight mb-4 text-ink-text">
              {item.title}
            </h2>
          )}

          {/* Фото улики — object-contain, без обрезки. */}
          {evidenceMediaId && (
            <BoardItemImage mediaId={evidenceMediaId} alt={item.title ?? ''} />
          )}

          {item.content && (
            <p
              className="text-[15px] leading-relaxed whitespace-pre-line text-ink-text-soft mb-6"
              style={{ fontFamily: 'var(--font-type, monospace)' }}
            >
              {item.content}
            </p>
          )}

          <div className="flex items-center justify-between gap-4 pt-4
                          border-t border-dashed border-ink-text/25 flex-wrap">
            <div className="type text-[11px] uppercase tracking-[0.2em] text-ink-text-dim">
              {item.createdByName && <span>{item.createdByName} · </span>}
              {new Date(item.createdAt).toLocaleString('ru-RU')}
            </div>

            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2 border border-blood/50 text-blood
                         type text-[11px] uppercase tracking-[0.22em]
                         hover:bg-blood/10 transition-colors cursor-pointer"
            >
              Убрать с доски
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BoardItemImage({ mediaId, alt }: { mediaId: string; alt: string }) {
  const url = useMediaUrl(mediaId);
  if (!url) return null;
  return (
    <div className="w-full mb-6 flex items-center justify-center">
      <img
        src={url}
        alt={alt}
        draggable={false}
        className="max-w-full max-h-[55vh] object-contain select-none"
        style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.45))' }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Мелкие компоненты
   ═══════════════════════════════════════════════════════════ */

function StatPill({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className="hidden md:flex flex-col items-end leading-none
                 px-3 py-2 bg-ink/90 backdrop-blur-sm
                 border border-brass/40"
      style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.7)' }}
    >
      <span className="type text-[9px] uppercase tracking-[0.26em] text-brass/70">
        {label}
      </span>
      <span
        className={
          'font-poster text-2xl tabular-nums mt-1 ' +
          (accent ? 'text-blood' : 'text-bone')
        }
      >
        {value}
      </span>
    </div>
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