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
import { useAuth } from '../auth/useAuth';
import { MapPanContainer } from '../components/admin/map/MapPanContainer';
import { BoardCard } from '../components/board/BoardCard';
import { BoardItemDetailModal } from '../components/board/BoardItemDetailModal';
import { getEvidencesByCase } from '../api/evidences';
import type { BoardItem } from '../types/board';
import type { GameSession } from '../types/session';
import type { ApiErrorResponse } from '../types/api';

const CANVAS_W = 8000;
const CANVAS_H = 5000;

/** Сохранение в БД — реже, чем typing. */
const NOTE_SAVE_DEBOUNCE_MS = 1200;
/** Отправка typing по WS — часто, чтобы буквально по буквам. */
const NOTE_TYPING_THROTTLE_MS = 100;
/** Через сколько «печатает…» считается протухшим. */
const NOTE_TYPING_TTL_MS = 2500;

interface EvidenceMeta {
  evidenceType: string;
  importance: string;
  contentText: string | null;
}

export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<GameSession | null>(null);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [evidenceMediaMap, setEvidenceMediaMap] = useState<Map<string, string | null>>(
    new Map()
  );
  const [evidenceMetaMap, setEvidenceMetaMap] = useState<Map<string, EvidenceMeta>>(
    new Map()
  );

  const [localPositions, setLocalPositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());

  const [noteText, setNoteText] = useState('');
  const [noteUpdater, setNoteUpdater] = useState<string | null>(null);
  const [noteUpdatedAt, setNoteUpdatedAt] = useState<string | null>(null);
  const [notePanelOpen, setNotePanelOpen] = useState(true);
  const [typingBy, setTypingBy] = useState<string | null>(null);
  const [typingText, setTypingText] = useState<string | null>(null);

  const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const noteSaveTimer = useRef<number | null>(null);
  const noteTypingLastSentAt = useRef(0);
  const typingClearTimer = useRef<number | null>(null);
  const noteDirtyRef = useRef(false);
  const noteLocalUpdateAtRef = useRef(0);

  const [zoom, setZoom] = useState(1);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [detailItem, setDetailItem] = useState<BoardItem | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  /* ---------- Загрузка ---------- */

  const reload = useCallback(async () => {
    if (!id) return;
    try {
      const [s, list, note] = await Promise.all([
        getSession(id),
        getBoardItems(id),
        getBoardNote(id).catch(() => ({
          text: '',
          updatedByPlayerName: null,
          updatedAt: null,
        })),
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
        const mediaMap = new Map<string, string | null>();
        const metaMap = new Map<string, EvidenceMeta>();
        evidences.forEach((ev) => {
          mediaMap.set(ev.id, ev.mediaId);
          metaMap.set(ev.id, {
            evidenceType: ev.evidenceType,
            importance: ev.importance,
            contentText: ev.contentText,
          });
        });
        setEvidenceMediaMap(mediaMap);
        setEvidenceMetaMap(metaMap);
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

  /* ---------- WebSocket ---------- */

  const socketRef = useBoardSocket(session?.id ?? id ?? null, () => {
    /* Полный reload, если что-то удалилось или добавилось не нами. */
    void reload();
  }, {
    onItemMoved: (event) => {
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
      /* Если это моё сохранение — игнорируем: я уже вижу свой текст. */
      if (user && event.updatedByPlayerName === user.displayName) {
        setNoteUpdatedAt(event.updatedAt);
        return;
      }
      setNoteText(event.text ?? '');
      setNoteUpdater(event.updatedByPlayerName);
      setNoteUpdatedAt(event.updatedAt);
      if (event.updatedByPlayerName) {
        showToast(`${event.updatedByPlayerName} обновил заметку`);
      }
    },

    onNoteTyping: (event) => {
      if (user && event.playerName === user.displayName) return;
      setTypingBy(event.playerName);
      setTypingText(event.text);
      if (typingClearTimer.current) window.clearTimeout(typingClearTimer.current);
      typingClearTimer.current = window.setTimeout(() => {
        setTypingBy(null);
        setTypingText(null);
      }, NOTE_TYPING_TTL_MS);
    },
  });

  /* ---------- Действия ---------- */

  const handleDelete = async (itemId: string) => {
    if (!id) return;
    if (!confirm('Убрать карточку с доски?')) return;
    try {
      await deleteBoardItem(id, itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setDetailItem(null);
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
    } catch { /* WS вернёт актуальное */ }
  };

  /* ---------- Заметка ---------- */

  const sendTyping = useCallback(
    (text: string) => {
      if (!user?.id || !session?.id) return;
      const client = socketRef.current;
      if (!client || !client.connected) return;
      const now = Date.now();
      if (now - noteTypingLastSentAt.current < NOTE_TYPING_THROTTLE_MS) return;
      noteTypingLastSentAt.current = now;
      try {
        client.publish({
          destination: `/app/sessions/${session.id}/board/note/typing`,
          body: JSON.stringify({ userId: user.id, text }),
        });
      } catch { /* ignore */ }
    },
    [socketRef, session?.id, user?.id]
  );

  const handleNoteChange = (text: string) => {
    setNoteText(text);
    noteDirtyRef.current = true;
    noteLocalUpdateAtRef.current = Date.now();

    /* Транзитный typing — по буквам. */
    sendTyping(text);

    /* Сохранение в БД — реже. */
    if (noteSaveTimer.current) window.clearTimeout(noteSaveTimer.current);
    noteSaveTimer.current = window.setTimeout(async () => {
      if (!id) return;
      try {
        await updateBoardNote(id, text);
        noteDirtyRef.current = false;
      } catch { /* ignore */ }
    }, NOTE_SAVE_DEBOUNCE_MS);
  };

  useEffect(() => {
    return () => {
      if (noteSaveTimer.current) window.clearTimeout(noteSaveTimer.current);
      if (typingClearTimer.current) window.clearTimeout(typingClearTimer.current);
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

  /* Кто-то другой печатает — показываем его текст поверх. */
  const typingPreviewActive = typingBy !== null && typingText !== null;
  const textareaShown = typingPreviewActive ? typingText : noteText;

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
              onOpen={setDetailItem}
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

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNotePanelOpen((v) => !v)}
              className={
                'inline-flex items-center gap-2 px-4 py-2.5 ' +
                'border-2 transition-colors cursor-pointer ' +
                (notePanelOpen
                  ? 'border-brass/60 bg-brass/10 text-brass'
                  : 'border-brass/40 bg-ink/90 text-bone-muted hover:text-bone')
              }
              style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.7)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.6" className="w-3.5 h-3.5">
                <path d="M4 20 L4 6 a2 2 0 0 1 2 -2 h10 l4 4 v12 a2 2 0 0 1 -2 2 z" />
                <line x1="8" y1="11" x2="16" y2="11" />
                <line x1="8" y1="15" x2="13" y2="15" />
              </svg>
              <span className="type text-[11px] uppercase tracking-[0.22em]">
                Заметка
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ───────── Панель заметки ───────── */}
      <aside
        className="fixed right-0 top-0 bottom-0 z-[110] pointer-events-none"
        aria-hidden={!notePanelOpen}
      >
        <div
          className={
            'h-full flex items-stretch transition-transform duration-300 ' +
            (notePanelOpen ? 'translate-x-0' : 'translate-x-[360px]')
          }
        >
          {/* Панель */}
          <div
            className="w-[340px] sm:w-[360px] h-full
                       border-l-2 border-brass/50 bg-ink/95
                       flex flex-col pointer-events-auto"
            style={{
              boxShadow:
                '-14px 0 46px rgba(0,0,0,0.85), ' +
                'inset 0 1px 0 rgba(201,162,74,0.2)',
            }}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-4
                            border-b border-brass/30">
              <div className="flex items-center gap-2 min-w-0">
                <span className="type text-[11px] uppercase tracking-[0.3em] text-brass whitespace-nowrap">
                  Общая заметка
                </span>
                {noteUpdatedAt && (
                  <span className="type text-[10px] tabular-nums
                                   tracking-[0.2em] text-bone-dim whitespace-nowrap">
                    {new Date(noteUpdatedAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setNotePanelOpen(false)}
                aria-label="Свернуть заметку"
                className="w-8 h-8 flex items-center justify-center
                           text-bone-muted hover:text-brass
                           type text-lg leading-none
                           transition-colors cursor-pointer"
              >
                →
              </button>
            </div>

            {typingPreviewActive && (
              <div className="flex items-center gap-2 px-4 py-2
                              border-b border-blood/30 bg-blood/10">
                <span className="type text-[10px] uppercase tracking-[0.24em]
                                 text-blood whitespace-nowrap">
                  ✎ {typingBy} печатает…
                </span>
              </div>
            )}

            {!typingPreviewActive && noteUpdater && (
              <div className="flex items-center gap-2 px-4 py-2
                              border-b border-brass/20">
                <span className="type text-[10px] uppercase tracking-[0.22em]
                                 text-bone-dim whitespace-nowrap">
                  последний правил: <span className="text-brass">{noteUpdater}</span>
                </span>
              </div>
            )}

            <textarea
              ref={noteTextareaRef}
              value={textareaShown}
              readOnly={typingPreviewActive}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Хронология, версии, что заметили. Всё видно команде сразу."
              className={
                'flex-1 min-h-0 w-full bg-transparent px-4 py-4 resize-none ' +
                'focus:outline-none leading-relaxed ' +
                (typingPreviewActive
                  ? 'text-bone-muted italic cursor-default'
                  : 'text-bone placeholder:text-bone-dim/70')
              }
              style={{
                fontFamily: 'var(--font-type, monospace)',
                fontSize: 14,
              }}
            />

            <div className="px-4 py-2 border-t border-brass/25
                            flex items-center justify-between
                            type text-[10px] uppercase tracking-[0.22em] text-bone-dim">
              <span>автосохранение</span>
              <span>все пишут</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ───────── Кнопка-таб, когда заметка свёрнута ───────── */}
      {!notePanelOpen && (
        <button
          type="button"
          onClick={() => setNotePanelOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[110]
                     px-3 py-4 bg-ink/95 border-l-2 border-y-2 border-brass/50
                     type text-[10px] uppercase tracking-[0.28em] text-brass
                     hover:bg-brass/10 transition-colors cursor-pointer"
          style={{
            boxShadow: '-8px 0 26px rgba(0,0,0,0.8)',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
          }}
          title="Открыть заметку"
        >
          ✎ Заметка
        </button>
      )}

      {/* ───────── Модалка деталей ───────── */}
      {detailItem && (
        <BoardItemDetailModal
          item={detailItem}
          evidenceMediaId={
            detailItem.evidenceId
              ? evidenceMediaMap.get(detailItem.evidenceId) ?? null
              : null
          }
          evidenceMeta={
            detailItem.evidenceId
              ? evidenceMetaMap.get(detailItem.evidenceId) ?? null
              : null
          }
          onDelete={() => handleDelete(detailItem.id)}
          onClose={() => setDetailItem(null)}
        />
      )}

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