import { useCallback } from 'react';

/**
 * Обёртка над Fullscreen API + попытка заблокировать ориентацию
 * в landscape.
 *
 * Возвращает Promise<boolean> — удалось ли заблокировать ориентацию.
 * false, если браузер не поддерживает lock (например, iOS Safari).
 */
export function useFullscreen() {
  const enterFullscreenAndLock = useCallback(async (): Promise<boolean> => {
    // 1. Пытаемся войти в fullscreen
    try {
      const el = document.documentElement;

      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (
        (el as unknown as { webkitRequestFullscreen?: () => Promise<void> })
          .webkitRequestFullscreen
      ) {
        await (
          el as unknown as { webkitRequestFullscreen: () => Promise<void> }
        ).webkitRequestFullscreen();
      }
    } catch {
      // fullscreen не разрешён — не критично, продолжаем
    }

    // 2. Пытаемся заблокировать ориентацию
    try {
      const so = screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>;
      };
      if (so && typeof so.lock === 'function') {
        await so.lock('landscape');
        return true;
      }
    } catch {
      // iOS Safari и некоторые десктопы не поддерживают lock
    }

    return false;
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
    try {
      const so = screen.orientation as ScreenOrientation & {
        unlock?: () => void;
      };
      if (so && typeof so.unlock === 'function') {
        so.unlock();
      }
    } catch {
      // ignore
    }
  }, []);

  return { enterFullscreenAndLock, exitFullscreen };
}