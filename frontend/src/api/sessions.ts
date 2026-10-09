import { apiClient } from './client';
import type {
  GameSession,
  SessionPlayer,
  JoinSessionRequest,
  JoinSessionResponse,
} from '../types/session';
import type { Location } from '../types/location';

const GUEST_TOKEN_KEY = 'quest.session.guestToken';

export function getStoredGuestToken(): string | null {
  return localStorage.getItem(GUEST_TOKEN_KEY);
}

export function setStoredGuestToken(token: string | null): void {
  if (token) {
    localStorage.setItem(GUEST_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(GUEST_TOKEN_KEY);
  }
}

export async function createSession(caseId: string): Promise<GameSession> {
  const response = await apiClient.post<GameSession>('/api/sessions', { caseId });
  return response.data;
}

export async function getMySessions(): Promise<GameSession[]> {
  const response = await apiClient.get<GameSession[]>('/api/sessions/mine');
  return response.data;
}

export async function getSession(id: string): Promise<GameSession> {
  const response = await apiClient.get<GameSession>(`/api/sessions/${id}`);
  return response.data;
}

export async function getSessionByCode(roomCode: string): Promise<GameSession> {
  const response = await apiClient.get<GameSession>(`/api/sessions/by-code/${roomCode}`);
  return response.data;
}

export async function getSessionPlayers(sessionId: string): Promise<SessionPlayer[]> {
  const response = await apiClient.get<SessionPlayer[]>(`/api/sessions/${sessionId}/players`);
  return response.data;
}

/**
 * Локации, доступные игрокам в сессии — только открытые.
 * Используется на странице игры вместо getLocationsByCase.
 */
export async function getAvailableLocations(sessionId: string): Promise<Location[]> {
  const res = await apiClient.get<Location[]>(
    `/api/sessions/${sessionId}/available-locations`
  );
  return res.data;
}

export async function joinSession(
  roomCode: string,
  request: JoinSessionRequest
): Promise<JoinSessionResponse> {
  const guestToken = getStoredGuestToken();
  const headers: Record<string, string> = {};
  if (guestToken) {
    headers['X-Guest-Token'] = guestToken;
  }
  const response = await apiClient.post<JoinSessionResponse>(
    `/api/sessions/by-code/${roomCode}/join`,
    request,
    { headers }
  );
  if (response.data.guestToken) {
    setStoredGuestToken(response.data.guestToken);
  }
  return response.data;
}

export async function startSession(sessionId: string): Promise<GameSession> {
  const response = await apiClient.post<GameSession>(`/api/sessions/${sessionId}/start`);
  return response.data;
}

export async function leaveSession(sessionId: string): Promise<SessionPlayer> {
  const response = await apiClient.post<SessionPlayer>(`/api/sessions/${sessionId}/leave`);
  return response.data;
}

export async function closeSession(sessionId: string): Promise<GameSession> {
  const response = await apiClient.post<GameSession>(`/api/sessions/${sessionId}/close`);
  return response.data;
}

/**
 * Удалить сессию. Только владелец и только если не ACTIVE.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/api/sessions/${sessionId}`);
}

/**
 * Движение игрока — в лобби или на сцене локации.
 *
 * x, y — проценты (0–100). facing — UP/DOWN/LEFT/RIGHT.
 * locationId — UUID локации, где игрок. null — на карте дела.
 *
 * Поле locationId используется бэком и WebSocket, чтобы другие игроки
 * не видели наш аватар на чужой сцене.
 */
export async function moveInLobby(
  sessionId: string,
  x: number,
  y: number,
  facing: string,
  locationId: string | null,
): Promise<void> {
  await apiClient.post(`/api/sessions/${sessionId}/lobby/move`, {
    x,
    y,
    facing,
    locationId,
  });
}

export async function changeAvatar(
  sessionId: string,
  avatarKey: string
): Promise<SessionPlayer> {
  const response = await apiClient.patch<SessionPlayer>(
    `/api/sessions/${sessionId}/players/me/avatar`,
    { avatarKey }
  );
  return response.data;
}

export async function setReady(
  sessionId: string,
  ready: boolean
): Promise<SessionPlayer> {
  const response = await apiClient.patch<SessionPlayer>(
    `/api/sessions/${sessionId}/players/me/ready`,
    { ready }
  );
  return response.data;
}

/** Исключить игрока из сессии. Только владелец. */
export async function kickPlayer(
  sessionId: string,
  playerId: string,
): Promise<void> {
  await apiClient.post(`/api/sessions/${sessionId}/players/${playerId}/kick`);
}