import { apiClient } from './client';
import type {
  ActionRequest,
  ActionResponse,
  SessionActionRequest,
  SessionActionResponse,
} from '../types/action';

/**
 * Старый endpoint без сессии. Оставлен для совместимости, но используйте sendSessionAction.
 */
export async function sendAction(request: ActionRequest): Promise<ActionResponse> {
  const response = await apiClient.post<ActionResponse>('/api/actions', request);
  return response.data;
}

/**
 * Действие внутри сессии. Сохраняет прогресс, once-события срабатывают один раз.
 */
export async function sendSessionAction(
  sessionId: string,
  request: SessionActionRequest
): Promise<SessionActionResponse> {
  const response = await apiClient.post<SessionActionResponse>(
    `/api/sessions/${sessionId}/actions`,
    request
  );
  return response.data;
}