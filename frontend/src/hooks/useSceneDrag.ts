import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  /** Контейнер-канвас, относительно которого считаем проценты. */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Текущие координаты (0–100%). */
  initialX: number;
  initialY: number;
  /** Вызывается при отпускании, если маркер реально сдвинулся. */
  onDragEnd?: (x: number, y: number) => void | Promise<void>;
  /** Вызывается при отпускании, если сдвига не было (клик). */
  onClick?: () => void;
  /** Порог в пикселях, ниже которого движение считается кликом. */
  dragThreshold?: number;
  enabled?: boolean;
}

/**
 * Хук для перетаскивания маркера по канвасу.
 *
 * Координаты в процентах (0–100) относительно контейнера.
 * Отличает drag от click по порогу (по умолчанию 3px).
 */
export function useSceneDrag({
  containerRef,
  initialX,
  initialY,
  onDragEnd,
  onClick,
  dragThreshold = 3,
  enabled = true,
}: Options) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);

  const posRef = useRef({ x: initialX, y: initialY });
  const dragStart = useRef({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
    moved: false,
  });

  // Синхронизация с внешними изменениями (пока не тащим)
  useEffect(() => {
    if (!isDragging) {
      setPos({ x: initialX, y: initialY });
      posRef.current = { x: initialX, y: initialY };
    }
  }, [initialX, initialY, isDragging]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();

      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        startX: posRef.current.x,
        startY: posRef.current.y,
        moved: false,
      };
      setIsDragging(true);
    },
    [enabled]
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dx = ((e.clientX - dragStart.current.mouseX) / rect.width) * 100;
      const dy = ((e.clientY - dragStart.current.mouseY) / rect.height) * 100;

      const nx = Math.max(0, Math.min(100, dragStart.current.startX + dx));
      const ny = Math.max(0, Math.min(100, dragStart.current.startY + dy));

      // Порог по абсолютному смещению от старта
      const absDx = Math.abs(e.clientX - dragStart.current.mouseX);
      const absDy = Math.abs(e.clientY - dragStart.current.mouseY);
      if (absDx > dragThreshold || absDy > dragThreshold) {
        dragStart.current.moved = true;
      }

      setPos({ x: nx, y: ny });
      posRef.current = { x: nx, y: ny };
    };

    const onUp = async () => {
      setIsDragging(false);
      if (dragStart.current.moved) {
        await onDragEnd?.(posRef.current.x, posRef.current.y);
      } else {
        onClick?.();
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, containerRef, dragThreshold, onDragEnd, onClick]);

  return {
    x: pos.x,
    y: pos.y,
    isDragging,
    onMouseDown,
  };
}