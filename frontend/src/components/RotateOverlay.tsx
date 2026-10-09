import { useState } from 'react';
import { useFullscreen } from '../hooks/useFullscreen';

interface Props {
  /** Вызывается, когда пользователь нажал кнопку "На весь экран" */
  onEntered?: () => void;
}

export function RotateOverlay({ onEntered }: Props) {
  const { enterFullscreenAndLock } = useFullscreen();
  const [busy, setBusy] = useState(false);
  const [lockFailed, setLockFailed] = useState(false);

  const handleEnter = async () => {
    setBusy(true);
    const locked = await enterFullscreenAndLock();
    setBusy(false);

    if (locked) {
      onEntered?.();
    } else {
      setLockFailed(true);
      onEntered?.();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-ink flex items-center justify-center p-6">
      {/* Красные нити по краям — атмосфера */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px
                      bg-gradient-to-r from-transparent via-blood/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px
                      bg-gradient-to-r from-transparent via-blood/60 to-transparent" />

      <div className="max-w-md w-full text-center relative">

        {/* Анимированная иконка телефона */}
        <div className="mb-8 flex justify-center">
          <div
            className="w-20 h-32 border-2 border-bone/60 rounded-sm relative
                       animate-[rotate-hint_2.4s_ease-in-out_infinite]"
          >
            <div className="absolute inset-2 border border-bone/20 rounded-sm" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-1.5
                            w-6 h-1 bg-bone/40 rounded-full" />
          </div>
        </div>

        {/* Kicker */}
        <span className="kicker justify-center inline-flex">
          Инструктаж
        </span>

        {/* Заголовок */}
        <h1 className="mt-5 text-[clamp(2rem,8vw,3rem)] leading-[0.92]
                       text-texture-bone">
          Поверните
          <br />
          <span className="text-texture-blood">экран</span>
        </h1>

        {/* Рукописная пометка */}
        <div className="mt-5 -rotate-1">
          <span className="hand text-xl md:text-2xl">
            так удобнее вести расследование
          </span>
        </div>

        {/* Пояснение */}
        <p className="mt-6 text-bone-muted text-[15px] leading-relaxed max-w-sm mx-auto">
          {lockFailed
            ? 'Ваш браузер не может повернуть экран сам. Поверните телефон горизонтально — приложение подстроится.'
            : 'Держите телефон горизонтально — так экран комнаты раскроется полностью.'}
        </p>

        {/* Кнопка */}
        {!lockFailed && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleEnter}
              disabled={busy}
              className="inline-flex items-center justify-center gap-3
                         font-mono uppercase tracking-[0.2em] text-[12px]
                         bg-blood text-bone px-8 py-4
                         hover:bg-blood-hover transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed
                         cursor-pointer"
            >
              {busy ? '⋯' : 'Повернуть и развернуть'}
              {!busy && <span>→</span>}
            </button>
          </div>
        )}

      </div>

      {/* Ключевые кадры для анимации поворота */}
      <style>{`
        @keyframes rotate-hint {
          0%, 40%   { transform: rotate(0deg); }
          60%, 100% { transform: rotate(-90deg); }
        }
      `}</style>
    </div>
  );
}