import { apiClient } from './client';
import type { ObjectInspectResponse } from '../types/inspect';

/**
 * Осмотреть объект в сессии. Возвращает объект и его улики,
 * автоматически кладёт улики в Портфель игрока.
 */
export async function inspectObject(
  sessionId: string,
  objectId: string
): Promise<ObjectInspectResponse> {
  const res = await apiClient.post<ObjectInspectResponse>(
    `/api/sessions/${sessionId}/objects/${objectId}/inspect`
  );
  return res.data;
}