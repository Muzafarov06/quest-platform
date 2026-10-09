import { apiClient } from './client';
import type {
  GameObject,
  GameObjectType,
  GameObjectState,
  GameObjectRenderLayer,
} from '../types/object';

// ---------- Public ----------

export async function getObjectsByLocation(locationId: string): Promise<GameObject[]> {
  const response = await apiClient.get<GameObject[]>(`/api/locations/${locationId}/objects`);
  return response.data;
}

export async function getObject(id: string): Promise<GameObject> {
  const response = await apiClient.get<GameObject>(`/api/objects/${id}`);
  return response.data;
}

// ---------- Admin ----------

export interface CreateGameObjectRequest {
  name: string;
  description?: string;
  objectType: GameObjectType;
  state: GameObjectState;
  mediaId?: string | null;
  sortOrder?: number;
  renderLayer?: GameObjectRenderLayer;
  walkable?: boolean;
}

export interface UpdateGameObjectRequest {
  name: string;
  description?: string;
  objectType: GameObjectType;
  state: GameObjectState;
  mediaId?: string | null;
  sortOrder: number;
  posX?: number;
  posY?: number;
  sceneScale?: number;
  sceneRotation?: number;
  renderLayer?: GameObjectRenderLayer;
  walkable?: boolean;
}

export async function adminListObjects(locationId: string): Promise<GameObject[]> {
  const response = await apiClient.get<GameObject[]>(
    `/api/admin/locations/${locationId}/objects`
  );
  return response.data;
}

export async function adminCreateObject(
  locationId: string,
  data: CreateGameObjectRequest
): Promise<GameObject> {
  const response = await apiClient.post<GameObject>(
    `/api/admin/locations/${locationId}/objects`,
    data
  );
  return response.data;
}

export async function adminUpdateObject(
  id: string,
  data: UpdateGameObjectRequest
): Promise<GameObject> {
  const response = await apiClient.put<GameObject>(`/api/admin/objects/${id}`, data);
  return response.data;
}

export async function adminDeleteObject(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/objects/${id}`);
}

/** PATCH позиции/масштаба/поворота маркера на сцене. */
export interface ObjectTransform {
  posX?: number;
  posY?: number;
  scale?: number;
  rotation?: number;
}

export async function adminUpdateObjectTransform(
  id: string,
  patch: ObjectTransform
): Promise<GameObject> {
  const response = await apiClient.patch<GameObject>(
    `/api/admin/objects/${id}/transform`,
    patch
  );
  return response.data;
}