import { useCallback, useEffect, useRef } from 'react';
import { moveInLobby } from '../api/sessions';
import type { Facing } from '../types/session';

const STEP = 0.6;
const FRAME_MS = 1000 / 60;
const SEND_INTERVAL_MS = 120;

const KEY_UP    = ['ArrowUp', 'w', 'W', 'ц', 'Ц'];
const KEY_DOWN  = ['ArrowDown', 's', 'S', 'ы', 'Ы'];
const KEY_LEFT  = ['ArrowLeft', 'a', 'A', 'ф', 'Ф'];
const KEY_RIGHT = ['ArrowRight', 'd', 'D', 'в', 'В'];
const ALL_KEYS = [...KEY_UP, ...KEY_DOWN, ...KEY_LEFT, ...KEY_RIGHT];

interface Options {
  sessionId: string | null | undefined;
  enabled: boolean;
  positionRef: React.MutableRefObject<{ x: number; y: number; facing: Facing }>;
  /** Опциональная коррекция позиции (например, коллизия со столом). */
  clamp?: (x: number, y: number) => { x: number; y: number };
  /** Локация, где игрок сейчас. null — на карте / в лобби. */
  locationId?: string | null;
}

export function useLobbyMovement({
  sessionId,
  enabled,
  positionRef,
  clamp,
  locationId = null,
}: Options) {
  const keysRef = useRef<Set<string>>(new Set());
  const lastSentRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastSentPosRef = useRef({ x: -1, y: -1, facing: '' as Facing | '' });
  const clampRef = useRef(clamp);
  const locationIdRef = useRef(locationId);

  useEffect(() => {
    clampRef.current = clamp;
  }, [clamp]);

  useEffect(() => {
    locationIdRef.current = locationId;
  }, [locationId]);

  const recompute = useCallback(() => {
    const keys = keysRef.current;
    const pos = positionRef.current;

    let dx = 0;
    let dy = 0;
    if (KEY_UP.some((k) => keys.has(k))) dy -= STEP;
    if (KEY_DOWN.some((k) => keys.has(k))) dy += STEP;
    if (KEY_LEFT.some((k) => keys.has(k))) dx -= STEP;
    if (KEY_RIGHT.some((k) => keys.has(k))) dx += STEP;

    if (dx === 0 && dy === 0) return;

    let nx = Math.max(4, Math.min(96, pos.x + dx));
    let ny = Math.max(6, Math.min(94, pos.y + dy));

    if (clampRef.current) {
      const corrected = clampRef.current(nx, ny);
      nx = corrected.x;
      ny = corrected.y;
    }

    pos.x = nx;
    pos.y = ny;

    if (Math.abs(dx) > Math.abs(dy)) {
      pos.facing = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      pos.facing = dy > 0 ? 'DOWN' : 'UP';
    }
  }, [positionRef]);

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

    let lastFrame = performance.now();
    const loop = (now: number) => {
      if (now - lastFrame >= FRAME_MS) {
        recompute();
        lastFrame = now;

        if (now - lastSentRef.current >= SEND_INTERVAL_MS) {
          const p = positionRef.current;
          const prev = lastSentPosRef.current;
          const changed =
            p.x !== prev.x || p.y !== prev.y || p.facing !== prev.facing;
          if (changed) {
            lastSentRef.current = now;
            lastSentPosRef.current = { x: p.x, y: p.y, facing: p.facing };
            moveInLobby(sessionId, p.x, p.y, p.facing, locationIdRef.current).catch(() => {});
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