/**
 * AABB-коллизии (axis-aligned bounding box).
 *
 * Используются в:
 *   • SceneEditorPage — объекты/персонажи/под-локации упираются друг в друга;
 *   • MapEditorPage — карточки локаций на карте дела упираются;
 *   • useSceneMovement — персонаж упирается в объекты при ходьбе.
 */

export interface Bounds {
  /** Центр по X. */
  x: number;
  /** Центр по Y. */
  y: number;
  /** Полуширина. */
  halfW: number;
  /** Полувысота. */
  halfH: number;
}

export interface IdentifiedBounds extends Bounds {
  id: string;
}

export function intersects(a: Bounds, b: Bounds): boolean {
  return (
    Math.abs(a.x - b.x) < a.halfW + b.halfW &&
    Math.abs(a.y - b.y) < a.halfH + b.halfH
  );
}

export function collidesWithAny(
  self: Bounds,
  others: IdentifiedBounds[],
  selfId: string | null,
  ignore: Set<string>
): boolean {
  for (const o of others) {
    if (selfId !== null && o.id === selfId) continue;
    if (ignore.has(o.id)) continue;
    if (intersects(self, o)) return true;
  }
  return false;
}

export function collectInitialCollisions(
  self: Bounds,
  others: IdentifiedBounds[],
  selfId: string
): Set<string> {
  const result = new Set<string>();
  for (const o of others) {
    if (o.id === selfId) continue;
    if (intersects(self, o)) result.add(o.id);
  }
  return result;
}

export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v;

export function normalizeRotation(r: number): number {
  let x = r;
  while (x > 180) x -= 360;
  while (x < -180) x += 360;
  return x;
}