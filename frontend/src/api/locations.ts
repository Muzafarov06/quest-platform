import { apiClient } from './client';
import type { Location, LocationType, DiscoveryMode } from '../types/location';

// ---------- Public ----------

export async function getLocationsByCase(caseId: string): Promise<Location[]> {
  const response = await apiClient.get<Location[]>(`/api/cases/${caseId}/locations`);
  return response.data;
}

export async function getLocation(id: string): Promise<Location> {
  const response = await apiClient.get<Location>(`/api/locations/${id}`);
  return response.data;
}

// ---------- Admin ----------

export interface CreateLocationRequest {
  name: string;
  description?: string;
  locationType: LocationType;
  parentId?: string | null;
  mediaId?: string | null;
  previewMediaId?: string | null;
  mapMediaId?: string | null;
  sortOrder?: number;
  discoveryMode?: DiscoveryMode;
  discoveryTargetId?: string | null;
  discoveryHint?: string;
}

export interface UpdateLocationRequest {
  name: string;
  description?: string;
  locationType: LocationType;
  parentId?: string | null;
  mediaId?: string | null;
  previewMediaId?: string | null;
  mapMediaId?: string | null;
  sortOrder: number;
  entryX?: number;
  entryY?: number;
  discoveryMode?: DiscoveryMode;
  discoveryTargetId?: string | null;
  discoveryHint?: string;
  sceneScale?: number;
  sceneRotation?: number;
}

export async function adminListLocations(caseId: string): Promise<Location[]> {
  const response = await apiClient.get<Location[]>(`/api/admin/cases/${caseId}/locations`);
  return response.data;
}

export async function adminCreateLocation(
  caseId: string,
  data: CreateLocationRequest
): Promise<Location> {
  const response = await apiClient.post<Location>(
    `/api/admin/cases/${caseId}/locations`,
    data
  );
  return response.data;
}

export async function adminUpdateLocation(
  id: string,
  data: UpdateLocationRequest
): Promise<Location> {
  const response = await apiClient.put<Location>(`/api/admin/locations/${id}`, data);
  return response.data;
}

export async function adminDeleteLocation(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/locations/${id}`);
}

export async function adminUpdateLocationMapPosition(
  id: string,
  mapX: number,
  mapY: number
): Promise<Location> {
  const response = await apiClient.patch<Location>(
    `/api/admin/locations/${id}/map-position`,
    { mapX: Math.round(mapX), mapY: Math.round(mapY) }
  );
  return response.data;
}

export interface LocationTransform {
  posX?: number;
  posY?: number;
  scale?: number;
  rotation?: number;
}

export async function adminUpdateLocationTransform(
  id: string,
  patch: LocationTransform
): Promise<Location> {
  const response = await apiClient.patch<Location>(
    `/api/admin/locations/${id}/transform`,
    patch
  );
  return response.data;
}

export interface LocationDeleteInfo {
  locationId: string;
  locationName: string;
  childLocations: number;
  childLocationNames: string[];
  objects: number;
  evidencesByLocation: number;
  connections: number;
  activeSessions: number;
  isEntry: boolean;
}

export async function adminGetLocationDeleteInfo(
  id: string
): Promise<LocationDeleteInfo> {
  const res = await apiClient.get<LocationDeleteInfo>(
    `/api/admin/locations/${id}/delete-info`
  );
  return res.data;
}