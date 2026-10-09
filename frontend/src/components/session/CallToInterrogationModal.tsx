import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAvailableCharacters } from '../../api/characters';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import type { Character } from '../../types/character';

interface Props {
  sessionId: string;
  onPick: (character: Character) => void;
  onClose: () => void;
}

/**
 * Модалка «Вызов на допрос».
 *
 * Открывается по клику на объект типа INTERROGATION_PHONE (телефон штаба).
 * Показывает только тех персонажей, чьи правила открытия уже сработали
 * в этой сессии. Список фильтруется на бэке — фронт просто рендерит.
 */
export function CallToInterrogationModal({ sessionId, onPick, onClose }: Props) {
  const [characters, setCharacters] = useState<Character[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAvailableCharacters(sessionId)
      .then(setCharacters)
      .catch(() => setError('Не удалось получить список.'));
  }, [sessionId]);

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
      className="fixed inset-0 z-[400] flex items-center justify-center
                 p-4 md:p-8 overflow-y-auto animate-fade-in"
      style={{ background: 'rgba(8, 7, 5, 0.9)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-auto animate-rise-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="paper paper-old relative shadow-paper-lift">
          <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />
          <div className="pin brass" style={{ top: -8, right: 44, zIndex: 20 }} />

          <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
            <span className="stamp-red text-xs">Вызов</span>
          </div>

          <header className="relative px-6 sm:px-8 pt-7 pb-5">
            <span className="kicker text-[11px]">Линия связи · штаб</span>
            <h2 className="mt-3 font-poster text-3xl sm:text-4xl leading-[0.95] text-texture-ink">
              Вызов на допрос
            </h2>
            <div className="mt-3 hand text-xl text-blood rotate-[-1.5deg]">
              кого поднять на разговор
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center
                         border border-ink-text/25 text-ink-text-soft
                         hover:text-blood hover:border-blood/50
                         transition-colors cursor-pointer"
            >
              ✕
            </button>
          </header>

          <div className="relative px-6 sm:px-8 pb-4">
            <div className="border-b border-dashed border-ink-text/25" />
          </div>

          <div className="relative px-6 sm:px-8 pb-8
                          min-h-[240px] max-h-[62vh] overflow-y-auto scroll-paper">
            {!characters && !error && (
              <div className="py-10 text-center
                              type text-[12px] uppercase tracking-[0.28em] text-ink-text-dim">
                Набираем номер…
              </div>
            )}

            {error && (
              <div className="mt-6 px-4 py-3 bg-blood/15 border-l-4 border-blood
                              type text-[13px] text-blood">
                {error}
              </div>
            )}

            {characters && characters.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="font-poster text-2xl text-ink-text mb-2">
                  Никого нет на месте
                </div>
                <p className="type text-[11px] uppercase tracking-[0.22em]
                              text-ink-text-dim max-w-sm leading-relaxed">
                  Ни один из фигурантов дела пока недоступен. Раскопайте
                  больше — и линия связи оживёт.
                </p>
              </div>
            )}

            {characters && characters.length > 0 && (
              <div className="flex flex-col gap-3 pt-2">
                {characters.map((c) => (
                  <InterrogationRow
                    key={c.id}
                    character={c}
                    onClick={() => onPick(c)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ============================================================ */

function InterrogationRow({
  character,
  onClick,
}: {
  character: Character;
  onClick: () => void;
}) {
  const photoUrl = useMediaUrl(character.dialogueMediaId ?? character.portraitMediaId);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative group flex items-center gap-4
                 border border-ink-text/25 bg-black/[0.04]
                 hover:border-blood/60 hover:bg-blood/[0.05]
                 transition-colors cursor-pointer
                 px-4 py-3 text-left w-full"
    >
      <div className="relative w-16 h-20 shrink-0 overflow-hidden
                      border border-ink-text/20 bg-ink-card">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={character.name}
            draggable={false}
            className="w-full h-full object-cover object-top select-none"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl" aria-hidden="true">🧑</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-poster text-lg text-ink-text leading-tight truncate">
          {character.name}
        </div>
        {character.description && (
          <div className="type text-[11px] text-ink-text-soft leading-snug
                          line-clamp-2 mt-1">
            {character.description}
          </div>
        )}
      </div>

      <div className="shrink-0 type text-[11px] uppercase tracking-[0.24em]
                      text-ink-text-dim group-hover:text-blood
                      transition-colors flex items-center gap-2">
        <span className="hidden sm:inline">Допросить</span>
        <span>→</span>
      </div>
    </button>
  );
}