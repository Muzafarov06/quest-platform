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

/** Передвинуть карточку. Позиция разлетится всем через WS. */
export async function moveBoardItem(
  sessionId: string,
  itemId: string,
  posX: number,
  posY: number
): Promise<BoardItem> {
  const response = await apiClient.patch<BoardItem>(
    `/api/sessions/${sessionId}/board/items/${itemId}/position`,
    { posX, posY }
  );
  return response.data;
}

/* ---------- Общая заметка ---------- */

export interface BoardNote {
  text: string;
  updatedByPlayerName: string | null;
  updatedAt: string | null;
}

export async function getBoardNote(sessionId: string): Promise<BoardNote> {
  const response = await apiClient.get<BoardNote>(
    `/api/sessions/${sessionId}/board/note`
  );
  return response.data;
}

export async function updateBoardNote(
  sessionId: string,
  text: string
): Promise<BoardNote> {
  const response = await apiClient.patch<BoardNote>(
    `/api/sessions/${sessionId}/board/note`,
    { text }
  );
  return response.data;
}