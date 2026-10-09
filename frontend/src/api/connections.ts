import { apiClient } from './client';
import type { LocationConnection } from '../types/connection';

// ---------- Public ----------

export async function getConnectionsFrom(locationId: string): Promise<LocationConnection[]> {
  const response = await apiClient.get<LocationConnection[]>(
    `/api/locations/${locationId}/connections`
  );
  return response.data;
}

// ---------- Admin ----------

export interface CreateConnectionRequest {
  toLocationId: string;
  label?: string;
  sortOrder?: number;
}

export async function adminListConnections(locationId: string): Promise<LocationConnection[]> {
  const response = await apiClient.get<LocationConnection[]>(
    `/api/admin/locations/${locationId}/connections`
  );
  return response.data;
}

export async function adminCreateConnection(
  locationId: string,
  data: CreateConnectionRequest
): Promise<LocationConnection> {
  const response = await apiClient.post<LocationConnection>(
    `/api/admin/locations/${locationId}/connections`,
    data
  );
  return response.data;
}

export async function adminDeleteConnection(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/connections/${id}`);
}