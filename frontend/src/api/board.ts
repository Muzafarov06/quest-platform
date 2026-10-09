import { apiClient } from './client';
import type { BoardItem, BoardConnection, CreateBoardItemRequest } from '../types/board';

export async function getBoardItems(sessionId: string): Promise<BoardItem[]> {
  const response = await apiClient.get<BoardItem[]>(
    `/api/sessions/${sessionId}/board/items`
  );
  return response.data;
}

export async function getBoardConnections(sessionId: string): Promise<BoardConnection[]> {
  const response = await apiClient.get<BoardConnection[]>(
    `/api/sessions/${sessionId}/board/connections`
  );
  return response.data;
}

export async function addBoardItem(
  sessionId: string,
  request: CreateBoardItemRequest
): Promise<BoardItem> {
  const response = await apiClient.post<BoardItem>(
    `/api/sessions/${sessionId}/board/items`,
    request
  );
  return response.data;
}

export async function deleteBoardItem(sessionId: string, itemId: string): Promise<void> {
  await apiClient.delete(`/api/sessions/${sessionId}/board/items/${itemId}`);
}