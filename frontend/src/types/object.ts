export type GameObjectType =
  | 'TELEPHONE'
  | 'COMPUTER'
  | 'DOOR'
  | 'SAFE'
  | 'CONTAINER'
  | 'DOCUMENT'
  | 'ITEM'
  | 'OTHER'
  | 'INTERROGATION_PHONE';

export type GameObjectState = 'CLOSED' | 'OPEN' | 'LOCKED' | 'BROKEN';

/** Слой отрисовки: -1 под всем, 0 по Y, +1 поверх всего. */
export type GameObjectRenderLayer = -1 | 0 | 1;

export interface GameObject {
  id: string;
  locationId: string;
  mediaId: string | null;
  name: string;
  description: string | null;
  objectType: GameObjectType;
  state: GameObjectState;
  sortOrder: number;
  posX: number;
  posY: number;
  sceneScale: number;
  sceneRotation: number;
  renderLayer: GameObjectRenderLayer;
  walkable: boolean;
  createdAt: string;
  updatedAt: string;
}