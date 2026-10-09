import type { GameObject } from './object';
import type { Location } from './location';
import type { LocationConnection } from './connection';
import type { Character } from './character';

export interface LocationScene {
  location: Location;
  objects: GameObject[];
  connections: LocationConnection[];
}

export interface PlayerScene {
  location: Location;
  objects: GameObject[];
  characters: Character[];
  connections: LocationConnection[];
  subLocations: Location[];
}

export interface PlayerMapLocation {
  id: string;
  name: string;
  locationType: string;
  mediaId: string | null;
  previewMediaId: string | null;
  mapMediaId: string | null;
  mapX: number;
  mapY: number;
  sceneScale: number;
  sceneRotation: number;
  unlocked: boolean;
  isEntry: boolean;
}

export interface PlayerMap {
  caseId: string;
  caseCode: string;
  caseTitle: string;
  mapMediaId: string | null;
  mapWidth: number;
  mapHeight: number;
  entryLocationId: string | null;
  locations: PlayerMapLocation[];
}