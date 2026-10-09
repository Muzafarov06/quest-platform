import { useEffect } from 'react';
import { playersRu } from '../../utils/plural';

interface Props {
  caseCode: string;
  caseTitle: string;
  caseDescription: string | null;
  playersCount: number;
  onDismiss: () => void;
}

/**
 * Вступительный экран.
 *
 * Полупрозрачный слой поверх карты: игрок видит карту за оверлеем,
 * но клики по карте не проходят, пока оверлей не закрыт.
 * Закрывается кликом в любом месте и по Enter/Space/Escape.
 */
export function SessionIntroOverlay({
  caseCode,
  caseTitle,
  caseDescription,
  playersCount,
  onDismiss,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        onDismiss();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center
                 p-4 md:p-8 cursor-pointer overflow-y-auto animate-fade-in"
      style={{
        // Лёгкое затемнение — карта видна, но приглушена.
        background: 'rgba(8, 7, 5, 0.55)',
      }}
      onClick={onDismiss}
    >
      <div className="relative max-w-3xl w-full my-auto">
        <div className="relative">
          {/* Булавки */}
          <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />
          <div className="pin brass" style={{ top: -8, right: 44, zIndex: 20 }} />

          {/* Пергамент */}
          <div className="paper paper-old p-8 md:p-14 relative">
            {/* Штамп — внутри листа, в правом верхнем углу с лёгким свесом */}
            <div
              className="absolute -top-1 -right-1 rotate-[8deg] z-10
                         origin-top-right"
            >
              <span
                className="stamp-red inline-block"
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  letterSpacing: '0.2em',
                }}
              >
                Конфиденциально
              </span>
            </div>

            <div className="type text-[11px] uppercase tracking-[0.32em] text-ink-text-soft mb-6">
              Дело · {caseCode}
            </div>

            <h1 className="text-[clamp(1.75rem,4.5vw,3rem)] leading-[0.95] text-ink-text mb-6 pr-24">
              {caseTitle}
            </h1>

            <div className="hand text-2xl md:text-3xl text-blood rotate-[-1deg] mb-8">
              ничего не известно…
            </div>

            {caseDescription && (
              <p className="text-ink-text-soft text-base md:text-lg leading-relaxed
                            whitespace-pre-line mb-8">
                {caseDescription}
              </p>
            )}

            <div className="border-t border-dashed border-ink-text/30 pt-6 mb-6">
              <div className="text-ink-text-soft text-[15px] leading-relaxed">
                У вас есть только карта, три адреса и команда из {playersCount}{' '}
                {playersRu(playersCount)}. Остальное — ваша работа:
                найти улики, допросить свидетелей, сопоставить факты и назвать имя
                того, кто это сделал.
              </div>
            </div>

            <div className="text-center pt-2">
              <div className="type text-[12px] uppercase tracking-[0.32em] text-blood">
                Нажмите, чтобы начать расследование
              </div>
              <div className="hand text-xl text-blood/70 rotate-[-1deg] mt-3">
                время пошло
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}