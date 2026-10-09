import { apiClient } from './client';
import type { LocationScene, PlayerScene, PlayerMap } from '../types/scene';
import type { GameObject } from '../types/object';
import type { Location } from '../types/location';
import type { LocationConnection } from '../types/connection';

export async function getScene(locationId: string): Promise<LocationScene> {
  const res = await apiClient.get<LocationScene>(
    `/api/admin/locations/${locationId}/scene`
  );
  return res.data;
}

export async function getPlayerScene(
  sessionId: string,
  locationId: string
): Promise<PlayerScene> {
  const res = await apiClient.get<PlayerScene>(
    `/api/sessions/${sessionId}/locations/${locationId}/scene`
  );
  return res.data;
}

export async function updateLocationEntry(
  locationId: string,
  entryX: number,
  entryY: number
): Promise<Location> {
  const res = await apiClient.get<Location>(`/api/admin/locations/${locationId}`);
  const current = res.data;

  const updated = await apiClient.put<Location>(`/api/admin/locations/${locationId}`, {
    name: current.name,
    description: current.description,
    locationType: current.locationType,
    parentId: current.parentId,
    mediaId: current.mediaId,
    previewMediaId: current.previewMediaId,
    mapMediaId: current.mapMediaId,
    sortOrder: current.sortOrder,
    entryX,
    entryY,
  });
  return updated.data;
}

export async function updateObjectPosition(
  objectId: string,
  posX: number,
  posY: number
): Promise<GameObject> {
  const res = await apiClient.get<GameObject>(`/api/admin/objects/${objectId}`);
  const current = res.data;

  const updated = await apiClient.put<GameObject>(`/api/admin/objects/${objectId}`, {
    name: current.name,
    description: current.description,
    objectType: current.objectType,
    state: current.state,
    mediaId: current.mediaId,
    sortOrder: current.sortOrder,
    posX,
    posY,
  });
  return updated.data;
}

export async function updateConnectionPosition(
  connectionId: string,
  posX: number | null,
  posY: number | null
): Promise<LocationConnection> {
  const updated = await apiClient.patch<LocationConnection>(
    `/api/admin/connections/${connectionId}`,
    { posX, posY }
  );
  return updated.data;
}

export async function getPlayerMap(sessionId: string): Promise<PlayerMap> {
  const res = await apiClient.get<PlayerMap>(`/api/sessions/${sessionId}/map`);
  return res.data;
}