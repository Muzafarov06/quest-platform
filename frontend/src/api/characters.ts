import { apiClient } from './client';
import type {
  Character,
  CharacterAdmin,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  CreateDialogRequest,
  UpdateDialogRequest,
} from '../types/character';

// ---------- Public ----------

export async function getCharactersByLocation(locationId: string): Promise<Character[]> {
  const response = await apiClient.get<Character[]>(
    `/api/locations/${locationId}/characters`
  );
  return response.data;
}

/** Все персонажи кейса — для админки и отладки. */
export async function getCharactersByCase(caseId: string): Promise<Character[]> {
  const response = await apiClient.get<Character[]>(
    `/api/cases/${caseId}/characters`
  );
  return response.data;
}

/**
 * Персонажи, доступные команде в этой сессии — для «Вызова на допрос».
 * Отдаёт только тех, чьи правила открытия уже сработали.
 */
export async function getAvailableCharacters(sessionId: string): Promise<Character[]> {
  const response = await apiClient.get<Character[]>(
    `/api/sessions/${sessionId}/characters/available`
  );
  return response.data;
}

export async function getCharacter(id: string): Promise<Character> {
  const response = await apiClient.get<Character>(`/api/characters/${id}`);
  return response.data;
}

// ---------- Admin ----------

export async function adminListCharacters(caseId: string): Promise<CharacterAdmin[]> {
  const response = await apiClient.get<CharacterAdmin[]>(
    `/api/admin/cases/${caseId}/characters`
  );
  return response.data;
}

export async function adminCreateCharacter(
  caseId: string,
  data: CreateCharacterRequest
): Promise<CharacterAdmin> {
  const response = await apiClient.post<CharacterAdmin>(
    `/api/admin/cases/${caseId}/characters`,
    data
  );
  return response.data;
}

export async function adminUpdateCharacter(
  id: string,
  data: UpdateCharacterRequest
): Promise<CharacterAdmin> {
  const response = await apiClient.put<CharacterAdmin>(`/api/admin/characters/${id}`, data);
  return response.data;
}

export async function adminUpdateCharacterPosition(
  id: string,
  posX: number,
  posY: number
): Promise<CharacterAdmin> {
  const response = await apiClient.patch<CharacterAdmin>(
    `/api/admin/characters/${id}/position`,
    { posX, posY }
  );
  return response.data;
}

export interface CharacterTransform {
  posX?: number;
  posY?: number;
  scale?: number;
  rotation?: number;
}

export async function adminUpdateCharacterTransform(
  id: string,
  patch: CharacterTransform
): Promise<CharacterAdmin> {
  const response = await apiClient.patch<CharacterAdmin>(
    `/api/admin/characters/${id}/transform`,
    patch
  );
  return response.data;
}

export async function adminDeleteCharacter(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/characters/${id}`);
}

export async function adminAddDialog(
  characterId: string,
  data: CreateDialogRequest
): Promise<CharacterAdmin> {
  const response = await apiClient.post<CharacterAdmin>(
    `/api/admin/characters/${characterId}/dialogs`,
    data
  );
  return response.data;
}

export async function adminUpdateDialog(
  dialogId: string,
  data: UpdateDialogRequest
): Promise<CharacterAdmin> {
  const response = await apiClient.put<CharacterAdmin>(
    `/api/admin/dialogs/${dialogId}`,
    data
  );
  return response.data;
}

export async function adminDeleteDialog(dialogId: string): Promise<void> {
  await apiClient.delete(`/api/admin/dialogs/${dialogId}`);
}