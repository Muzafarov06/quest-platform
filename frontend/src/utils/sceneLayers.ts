/**
 * Слои отрисовки на сцене локации.
 *
 * Пирамида (сверху вниз):
 *   selected (админка)          — 100_000_000+
 *   hovered  (админка)          — 50_000_000+
 *   свой игрок (я)              — 10_000_000
 *   другие игроки               — 300_000
 *   персонажи (NPC)             — 200_000
 *   overlay объекты (слой +1)   — 100_000
 *   обычные объекты (по Y)      — 1_000
 *   фоновые объекты (слой −1)   — 0
 *
 * Числа выбраны с большим запасом, чтобы posY (0..100) никогда
 * не «перебил» разницу между слоями.
 *
 * Правило по типу (DOOR → фон) — дефолт, но явный renderLayer
 * из формы объекта его перекрывает.
 */

import type { GameObjectRenderLayer, GameObjectType } from '../types/object';

export const LAYER_BACKGROUND = 0;
export const LAYER_BASE = 1000;
export const LAYER_OVERLAY = 100_000;
export const LAYER_CHARACTER = 200_000;
export const LAYER_PLAYER = 300_000;
export const LAYER_ME = 10_000_000;

export const Z_OFFSET_HOVERED = 50_000_000;
export const Z_OFFSET_SELECTED = 100_000_000;

/**
 * Дефолтный слой по типу объекта — используется, если renderLayer
 * не задан явно в форме.
 */
export function defaultLayerForType(type: GameObjectType): number {
  if (type === 'DOOR') return LAYER_BACKGROUND;
  return LAYER_BASE;
}

/**
 * Итоговый слой для объекта.
 *
 *   renderLayer = −1 → фон
 *   renderLayer =  0 → обычный слой по типу
 *   renderLayer = +1 → overlay
 */
export function resolveObjectLayer(
  type: GameObjectType | undefined,
  renderLayer: GameObjectRenderLayer | undefined
): number {
  if (renderLayer === -1) return LAYER_BACKGROUND;
  if (renderLayer === 1) return LAYER_OVERLAY;
  if (type) return defaultLayerForType(type);
  return LAYER_BASE;
}

/**
 * Универсальный слой для пина с учётом его варианта.
 *
 *   object       → слой объекта (DOOR, overlay и т.д.)
 *   character    → LAYER_CHARACTER (поверх всех объектов)
 *   sublocation  → LAYER_BASE
 *   exit         → LAYER_BASE
 *   entry        → LAYER_BASE
 */
export function resolvePinLayer(
  variant: 'entry' | 'object' | 'character' | 'sublocation' | 'exit',
  objectType: GameObjectType | undefined,
  renderLayer: GameObjectRenderLayer | undefined
): number {
  if (variant === 'character') return LAYER_CHARACTER;
  if (variant === 'object') return resolveObjectLayer(objectType, renderLayer);
  return LAYER_BASE;
}

/** z-index = слой + posY. posY — 0..100, никогда не пересечёт границу. */
export function computePinZ(layer: number, y: number): number {
  return Math.round(layer + y);
}