import { useCallback, useEffect, useRef } from 'react';
import type { Facing } from '../types/session';

export interface SceneObstacle {
  id: string;
  x: number;
  y: number;
  halfW: number;
  halfH: number;
}

interface Options {
  sessionId: string | null | undefined;
  enabled: boolean;
  positionRef: React.MutableRefObject<{ x: number; y: number; facing: Facing }>;
  obstacles: SceneObstacle[];
  step?: number;
  playerRadius?: number;
  onSend?: (
    sessionId: string,
    x: number,
    y: number,
    facing: Facing,
    locationId: string | null,
  ) => void | Promise<void>;
  locationId?: string | null;
}

const KEY_UP = ['ArrowUp', 'w', 'W', 'ц', 'Ц'];
const KEY_DOWN = ['ArrowDown', 's', 'S', 'ы', 'Ы'];
const KEY_LEFT = ['ArrowLeft', 'a', 'A', 'ф', 'Ф'];
const KEY_RIGHT = ['ArrowRight', 'd', 'D', 'в', 'В'];
const ALL_KEYS = [...KEY_UP, ...KEY_DOWN, ...KEY_LEFT, ...KEY_RIGHT];

const FRAME_MS = 1000 / 60;
const SEND_INTERVAL_MS = 140;

function collidesWithAny(
  x: number,
  y: number,
  r: number,
  obstacles: SceneObstacle[]
): boolean {
  for (const o of obstacles) {
    if (
      Math.abs(x - o.x) < r + o.halfW &&
      Math.abs(y - o.y) < r + o.halfH
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Спиральный поиск ближайшей свободной точки.
 * Радиус расширен до 80%, добавлен fallback на центр сцены —
 * так персонаж не застревает между двумя препятствиями.
 */
function findFreePoint(
  x: number,
  y: number,
  r: number,
  obstacles: SceneObstacle[]
): { x: number; y: number } {
  if (!collidesWithAny(x, y, r, obstacles)) return { x, y };

  for (let radius = 1.5; radius <= 80; radius += 2) {
    const steps = Math.max(16, Math.round(radius * 3));
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const nx = Math.max(2, Math.min(98, x + Math.cos(angle) * radius));
      const ny = Math.max(4, Math.min(96, y + Math.sin(angle) * radius));
      if (!collidesWithAny(nx, ny, r, obstacles)) {
        return { x: nx, y: ny };
      }
    }
  }

  /* Fallback: центр сцены. */
  const cx = 50;
  const cy = 50;
  if (!collidesWithAny(cx, cy, r, obstacles)) return { x: cx, y: cy };

  return { x, y };
}

export function useSceneMovement({
  sessionId,
  enabled,
  positionRef,
  obstacles,
  step = 0.6,
  playerRadius = 2.5,
  onSend,
  locationId = null,
}: Options) {
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const lastSendRef = useRef(0);
  const lastSentPosRef = useRef({
    x: -1,
    y: -1,
    facing: '' as Facing | '',
  });

  const obstaclesRef = useRef(obstacles);
  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  const onSendRef = useRef(onSend);
  useEffect(() => {
    onSendRef.current = onSend;
  }, [onSend]);

  const locationIdRef = useRef(locationId);
  useEffect(() => {
    locationIdRef.current = locationId;
  }, [locationId]);

  /* Автовыход из препятствия. */
  useEffect(() => {
    if (!enabled || !sessionId) return;
    const p = positionRef.current;
    if (!collidesWithAny(p.x, p.y, playerRadius, obstacles)) return;

    const safe = findFreePoint(p.x, p.y, playerRadius, obstacles);
    if (safe.x === p.x && safe.y === p.y) return;

    p.x = safe.x;
    p.y = safe.y;
    if (onSendRef.current) {
      void onSendRef.current(sessionId, p.x, p.y, p.facing, locationIdRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionId, obstacles, playerRadius]);

  const recompute = useCallback(() => {
    const keys = keysRef.current;
    const pos = positionRef.current;

    let dx = 0;
    let dy = 0;
    if (KEY_UP.some((k) => keys.has(k))) dy -= step;
    if (KEY_DOWN.some((k) => keys.has(k))) dy += step;
    if (KEY_LEFT.some((k) => keys.has(k))) dx -= step;
    if (KEY_RIGHT.some((k) => keys.has(k))) dx += step;

    if (dx === 0 && dy === 0) return;

    let nx = pos.x + dx;
    let ny = pos.y + dy;
    nx = Math.max(2, Math.min(98, nx));
    ny = Math.max(4, Math.min(96, ny));

    const obs = obstaclesRef.current;

    /* Если уже внутри препятствия — пробуем выйти. */
    if (collidesWithAny(pos.x, pos.y, playerRadius, obs)) {
      const safe = findFreePoint(nx, ny, playerRadius, obs);
      pos.x = safe.x;
      pos.y = safe.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        pos.facing = dx > 0 ? 'RIGHT' : 'LEFT';
      } else {
        pos.facing = dy > 0 ? 'DOWN' : 'UP';
      }
      return;
    }

    if (dx !== 0 && dy !== 0) {
      if (!collidesWithAny(nx, ny, playerRadius, obs)) {
        pos.x = nx;
        pos.y = ny;
      } else {
        const tryX = pos.x + dx;
        if (
          tryX >= 2 &&
          tryX <= 98 &&
          !collidesWithAny(tryX, pos.y, playerRadius, obs)
        ) {
          pos.x = tryX;
        }
        const tryY = pos.y + dy;
        if (
          tryY >= 4 &&
          tryY <= 96 &&
          !collidesWithAny(pos.x, tryY, playerRadius, obs)
        ) {
          pos.y = tryY;
        }
      }
    } else if (dx !== 0) {
      if (!collidesWithAny(nx, pos.y, playerRadius, obs)) {
        pos.x = nx;
      }
    } else if (dy !== 0) {
      if (!collidesWithAny(pos.x, ny, playerRadius, obs)) {
        pos.y = ny;
      }
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      pos.facing = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      pos.facing = dy > 0 ? 'DOWN' : 'UP';
    }
  }, [positionRef, step, playerRadius]);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (ALL_KEYS.includes(e.key)) {
        keysRef.current.add(e.key);
        if (e.key.startsWith('Arrow')) e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    const onBlur = () => keysRef.current.clear();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    const loop = (now: number) => {
      if (now - lastFrameRef.current >= FRAME_MS) {
        lastFrameRef.current = now;
        recompute();

        if (now - lastSendRef.current >= SEND_INTERVAL_MS) {
          const p = positionRef.current;
          const prev = lastSentPosRef.current;
          const changed =
            p.x !== prev.x || p.y !== prev.y || p.facing !== prev.facing;
          if (changed && onSendRef.current) {
            lastSendRef.current = now;
            lastSentPosRef.current = { x: p.x, y: p.y, facing: p.facing };
            void onSendRef.current(
              sessionId,
              p.x,
              p.y,
              p.facing,
              locationIdRef.current,
            );
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      keysRef.current.clear();
    };
  }, [enabled, sessionId, recompute, positionRef]);
}