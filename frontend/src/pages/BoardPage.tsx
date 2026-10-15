import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getBoardItems,
  deleteBoardItem,
  moveBoardItem,
  getBoardNote,
  updateBoardNote,
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
import type { BoardItem } from '../types/board';
import type { GameSession } from '../types/session';
import type { ApiErrorResponse } from '../types/api';

const CANVAS_W = 5000;
const CANVAS_H = 3500;

const NOTE_DEBOUNCE_MS = 800;
const NOTE_STALE_MS = 2500;

export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<GameSession | null>(null);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** evidenceId → mediaId. Картинки на карточках. */
  const [evidenceMediaMap, setEvidenceMediaMap] = useState<Map<string, string | null>>(
    new Map()
  );

  /* Локальные позиции — для оптимистичного drag. */
  const [localPositions, setLocalPositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());

  /* Общая заметка. */
  const [noteText, setNoteText] = useState('');
  const [noteUpdater, setNoteUpdater] = useState<string | null>(null);
  const [noteUpdatedAt, setNoteUpdatedAt] = useState<string | null>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const noteDirtyRef = useRef(false);
  const noteDebounceTimer = useRef<number | null>(null);

  const [zoom, setZoom] = useState(1);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2000);
  }, []);

  /* ---------- Загрузка ---------- */

  const reload = useCallback(async () => {
    if (!id) return;
    try {
      const [s, list, note] = await Promise.all([
        getSession(id),
        getBoardItems(id),
        getBoardNote(id).catch(() => ({ text: '', updatedByPlayerName: null, updatedAt: null })),
      ]);
      setSession(s);
      setItems(list);
      if (!noteDirtyRef.current) {
        setNoteText(note.text ?? '');
        setNoteUpdater(note.updatedByPlayerName);
        setNoteUpdatedAt(note.updatedAt);
      }

      try {
        const evidences = await getEvidencesByCase(s.caseId);
        const m = new Map<string, string | null>();
        evidences.forEach((ev) => m.set(ev.id, ev.mediaId));
        setEvidenceMediaMap(m);
      } catch {
        /* ignore */
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

  /* ---------- WebSocket: рилтайм ---------- */

  useBoardSocket(session?.id ?? id ?? null, reload, {
    onItemMoved: (event) => {
      /* Если я сам двигаю эту карточку — не перебиваю локальное состояние. */
      setLocalPositions((prev) => {
        const next = new Map(prev);
        next.set(event.itemId, { x: event.posX, y: event.posY });
        return next;
      });
      setItems((prev) =>
        prev.map((it) =>
          it.id === event.itemId
            ? { ...it, posX: event.posX, posY: event.posY }
            : it
        )
      );
    },
    onNoteUpdated: (event) => {
      /* Если у меня фокус в textarea и я недавно писал — не перебиваю. */
      const isFocused =
        document.activeElement === noteTextareaRef.current;
      if (isFocused && noteDirtyRef.current) {
        return;
      }
      setNoteText(event.text ?? '');
      setNoteUpdater(event.updatedByPlayerName);
      setNoteUpdatedAt(event.updatedAt);
      if (!isFocused && event.updatedByPlayerName) {
        showToast(`${event.updatedByPlayerName} обновил заметку`);
      }
    },
  });

  /* ---------- Действия с уликами ---------- */

  const handleDelete = async (itemId: string) => {
    if (!id) return;
    if (!confirm('Убрать карточку с доски?')) return;
    try {
      await deleteBoardItem(id, itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch {
      showToast('Не удалось удалить карточку');
    }
  };

  const positions = (() => {
    const m = new Map<string, { x: number; y: number }>();
    items.forEach((it) => {
      const local = localPositions.get(it.id);
      m.set(it.id, local ?? { x: it.posX, y: it.posY });
    });
    return m;
  })();

  const handlePositionChange = async (itemId: string, x: number, y: number) => {
    setLocalPositions((prev) => {
      const next = new Map(prev);
      next.set(itemId, { x, y });
      return next;
    });
    if (!id) return;
    try {
      await moveBoardItem(id, itemId, x, y);
    } catch {
      /* не критично — WS вернёт актуальную позицию */
    }
  };

  /* ---------- Действия с заметкой ---------- */

  const handleNoteChange = (text: string) => {
    setNoteText(text);
    noteDirtyRef.current = true;

    if (noteDebounceTimer.current) {
      window.clearTimeout(noteDebounceTimer.current);
    }
    noteDebounceTimer.current = window.setTimeout(async () => {
      if (!id) return;
      try {
        await updateBoardNote(id, text);
        noteDirtyRef.current = false;
      } catch {
        /* оставим dirty — попробуем в следующий раз */
      }
    }, NOTE_DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (noteDebounceTimer.current) {
        window.clearTimeout(noteDebounceTimer.current);
      }
    };
  }, []);

  /* ---------- Render ---------- */

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

  const noteIsFresh = noteUpdatedAt
    ? Date.now() - new Date(noteUpdatedAt).getTime() < NOTE_STALE_MS
    : false;

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
        {/* Фон доски */}
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

        <div className="absolute inset-0" style={{ zIndex: 20 }}>
          {items.map((item) => (
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
              onDelete={handleDelete}
              onPositionChange={handlePositionChange}
            />
          ))}
        </div>
      </MapPanContainer>

      {/* ───────── Верхняя панель ───────── */}
      <header className="absolute top-0 inset-x-0 z-[100] px-4 sm:px-6 py-4 pointer-events-none">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between gap-4 flex-wrap">
          <div className="pointer-events-auto flex items-center gap-3 flex-wrap">
            <Link
              to={`/sessions/${session.id}/play`}
              className="inline-flex items-center gap-2
                         px-4 py-2.5 border-2 border-brass/50
                         bg-ink/90
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
                         px-4 py-2.5 bg-ink/90
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

          <div className="pointer-events-auto flex items-center gap-2">
            <div
              className="hidden md:flex items-center gap-2
                         px-4 py-2.5 bg-ink/90 border border-brass/40"
              style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.7)' }}
            >
              <span className="type text-[10px] uppercase tracking-[0.26em] text-brass/70">
                Улик
              </span>
              <span className="font-poster text-2xl text-blood tabular-nums leading-none">
                {items.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ───────── Панель общей заметки ───────── */}
      <aside
        className="absolute right-4 top-20 z-[100] w-[340px] sm:w-[400px]
                   max-h-[70vh] flex flex-col
                   border-2 border-brass/50 bg-ink/95"
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(201,162,74,0.2), ' +
            '0 20px 50px rgba(0,0,0,0.9), ' +
            '0 0 30px rgba(201,162,74,0.06)',
        }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3
                        border-b border-brass/30">
          <div className="flex items-center gap-2 min-w-0">
            <span className="type text-[11px] uppercase tracking-[0.3em] text-brass whitespace-nowrap">
              Общая заметка
            </span>
            {noteIsFresh && noteUpdater && (
              <span className="type text-[10px] uppercase tracking-[0.2em]
                               text-blood whitespace-nowrap truncate">
                ✎ {noteUpdater}
              </span>
            )}
          </div>
          <span className="type text-[10px] uppercase tracking-[0.22em]
                           text-bone-muted whitespace-nowrap">
            все пишут
          </span>
        </div>

        <textarea
          ref={noteTextareaRef}
          value={noteText}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="Пишите сюда хронологию, версии, что заметили. Всё видно команде сразу."
          className="flex-1 min-h-[260px] w-full bg-transparent
                     text-bone placeholder:text-bone-dim/70
                     px-4 py-3 resize-none focus:outline-none
                     leading-relaxed"
          style={{
            fontFamily: 'var(--font-type, monospace)',
            fontSize: 14,
            overflowY: 'auto',
          }}
        />

        <div className="px-4 py-2 border-t border-brass/25
                        flex items-center justify-between
                        type text-[10px] uppercase tracking-[0.22em] text-bone-dim">
          <span>автосохранение</span>
          {noteUpdatedAt && (
            <span className="tabular-nums">
              {new Date(noteUpdatedAt).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </aside>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300]
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