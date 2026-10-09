import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMediaUrl } from '../hooks/useMediaUrl';
import type { Character, CharacterDialog } from '../types/character';

interface Props {
  character: Character;
  onClose: () => void;
}

/**
 * Окно разговора с персонажем.
 *
 * Слева — большая фотография в полный рост (или спрайт, если
 * фотографии нет), оформленная как «папка с делом». Справа —
 * имя, описание и протокол допроса: вопросы игрока и ответы
 * персонажа в стиле детективной доски.
 */
export function CharacterModal({ character, onClose }: Props) {
  const photoUrl = useMediaUrl(
    character.dialogueMediaId ?? character.portraitMediaId
  );
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [askedDialogs, setAskedDialogs] = useState<Set<string>>(new Set());

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

  const toggleDialog = (d: CharacterDialog) => {
    setOpenDialogId((prev) => (prev === d.id ? null : d.id));
    setAskedDialogs((prev) => new Set(prev).add(d.id));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center
                 p-4 md:p-8 overflow-y-auto animate-fade-in"
      style={{ background: 'rgba(8, 7, 5, 0.88)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl my-auto animate-rise-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="paper paper-old relative shadow-paper-lift">
          <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />
          <div className="pin brass" style={{ top: -8, right: 44, zIndex: 20 }} />

          <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
            <span className="stamp-red text-xs">Допрос</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(280px,_42%)_1fr]">
            {/* ─────────── Левая колонка — фото персонажа ─────────── */}
            <div className="relative p-5 md:p-7 md:pr-3 md:border-r border-dashed border-ink-text/25">
              <div className="relative w-full h-[55vh] md:h-[72vh] max-h-[720px]
                              flex items-center justify-center">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={character.name}
                    draggable={false}
                    className="max-w-full max-h-full object-contain select-none"
                    style={{
                      filter: 'drop-shadow(0 12px 26px rgba(0,0,0,0.45))',
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center
                               border-2 border-dashed border-ink-text/25"
                  >
                    <span className="text-6xl" aria-hidden="true">🧑</span>
                    <span
                      className="type text-[10px] uppercase tracking-[0.24em]
                                 text-ink-text-dim mt-3"
                    >
                      нет фотографии
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-ink-text/25">
                <div className="type text-[10px] uppercase tracking-[0.3em]
                                text-ink-text-dim mb-1">
                  Задержан / вызван на допрос
                </div>
                <div
                  className="hand text-2xl text-blood rotate-[-1.5deg]"
                  style={{ lineHeight: 1 }}
                >
                  {character.name}
                </div>
              </div>
            </div>

            {/* ─────────── Правая колонка — описание и диалог ─────────── */}
            <div className="relative p-6 md:p-8 flex flex-col gap-6
                            max-h-[80vh] overflow-y-auto scroll-paper">
              {/* Шапка */}
              <header className="relative">
                <span className="kicker text-[11px]">Протокол допроса</span>

                <h2 className="mt-3 font-poster text-3xl sm:text-4xl leading-[0.95]
                               text-texture-ink break-words">
                  {character.name}
                </h2>

                {character.description && (
                  <p
                    className="mt-4 text-ink-text-soft text-[14px] leading-relaxed
                               whitespace-pre-line"
                    style={{ fontFamily: 'var(--font-type, monospace)' }}
                  >
                    {character.description}
                  </p>
                )}
              </header>

              <div className="border-t border-dashed border-ink-text/25" />

              {/* Диалоги */}
              <div className="flex flex-col gap-4">
                <div className="type text-[10px] uppercase tracking-[0.3em]
                                text-blood">
                  Вопросы следствия
                </div>

                {character.dialogs.length === 0 ? (
                  <p className="type text-[12px] text-ink-text-dim italic">
                    Персонаж отказывается говорить. Пока.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {character.dialogs.map((d) => {
                      const isOpen = openDialogId === d.id;
                      const wasAsked = askedDialogs.has(d.id);
                      return (
                        <div key={d.id} className="relative">
                          {/* Вопрос */}
                          <button
                            type="button"
                            onClick={() => toggleDialog(d)}
                            className={
                              'w-full text-left px-4 py-2.5 border ' +
                              'transition-colors cursor-pointer ' +
                              (isOpen
                                ? 'border-blood bg-blood/[0.08]'
                                : wasAsked
                                ? 'border-ink-text/25 bg-black/[0.03]'
                                : 'border-ink-text/30 hover:border-blood/60')
                            }
                          >
                            <span
                              className={
                                'type text-[12px] tracking-[0.06em] ' +
                                (isOpen
                                  ? 'text-blood'
                                  : 'text-ink-text')
                              }
                              style={{ fontFamily: 'var(--font-type, monospace)' }}
                            >
                              {isOpen ? '▼ ' : '▶ '}
                              {d.question}
                            </span>
                          </button>

                          {/* Ответ */}
                          {isOpen && (
                            <div
                              className="relative mt-2 ml-4 pl-4
                                         border-l-2 border-blood/60"
                            >
                              <div
                                className="absolute -left-[5px] top-3
                                           w-2.5 h-2.5 rounded-full bg-blood"
                              />
                              <div
                                className="text-ink-text text-[14px] leading-relaxed
                                           whitespace-pre-line"
                                style={{ fontFamily: 'var(--font-type, monospace)' }}
                              >
                                {d.answer}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Подвал */}
              <div className="mt-auto pt-5 border-t border-dashed border-ink-text/25
                              flex items-center justify-between gap-4 flex-wrap">
                <span className="hand text-lg text-blood/90 rotate-[-1deg]">
                  допрос продолжается
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-blood text-paper px-6 py-3
                             type text-[12px] uppercase tracking-[0.24em]
                             hover:bg-blood-hover transition-colors cursor-pointer"
                >
                  Закончить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}