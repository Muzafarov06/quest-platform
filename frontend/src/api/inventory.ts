import { apiClient } from './client';
import type { InventoryItem, DiscoveredEvidence } from '../types/inventory';

export async function getMyInventory(sessionId: string): Promise<InventoryItem[]> {
  const response = await apiClient.get<InventoryItem[]>(`/api/sessions/${sessionId}/inventory`);
  return response.data;
}

export async function takeEvidence(sessionId: string, evidenceId: string): Promise<InventoryItem> {
  const response = await apiClient.post<InventoryItem>(
    `/api/sessions/${sessionId}/inventory/${evidenceId}`
  );
  return response.data;
}

export async function getDiscovered(sessionId: string): Promise<DiscoveredEvidence[]> {
  const response = await apiClient.get<DiscoveredEvidence[]>(
    `/api/sessions/${sessionId}/discovered`
  );
  return response.data;
}