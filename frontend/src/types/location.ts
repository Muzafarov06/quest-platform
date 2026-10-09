export type LocationType =
  | 'HOUSE'
  | 'ROOM'
  | 'STREET'
  | 'FOREST'
  | 'VEHICLE'
  | 'DIGITAL'
  | 'BUILDING'
  | 'OTHER';

export type DiscoveryMode =
  | 'ALWAYS'
  | 'ON_EVIDENCE'
  | 'ON_DIALOG'
  | 'ON_LOCATION'
  | 'ON_MANUAL';

export interface Location {
  id: string;
  caseId: string;
  parentId: string | null;
  mediaId: string | null;
  previewMediaId: string | null;
  mapMediaId: string | null;
  name: string;
  description: string | null;
  locationType: LocationType;
  sortOrder: number;
  entryX: number;
  entryY: number;
  discoveryMode: DiscoveryMode;
  discoveryTargetId: string | null;
  discoveryHint: string | null;
  mapX: number;
  mapY: number;
  sceneScale: number;
  sceneRotation: number;
  createdAt: string;
  updatedAt: string;
}