import { apiClient } from './client';
import type { Case } from '../types/case';
import type { GameSession } from '../types/session';

export interface CreateCaseRequest {
  code: string;
  title: string;
  description?: string;
  genre: string;
  ageLimit?: number;
  minPlayers?: number;
  maxPlayers?: number;
  durationMinutes?: number;
  priceCents?: number;
}

export interface UpdateCaseRequest {
  title?: string;
  description?: string;
  genre?: string;
  ageLimit?: number;
  minPlayers?: number;
  maxPlayers?: number;
  durationMinutes?: number;
  priceCents?: number;
  coverMediaId?: string;
}

export interface WhoamiResponse {
  userId: string;
  email: string;
  displayName: string;
  roles: string[];
}

export async function listAllCases(): Promise<Case[]> {
  const response = await apiClient.get<Case[]>('/api/admin/cases');
  return response.data;
}

export async function getAdminCase(id: string): Promise<Case> {
  const response = await apiClient.get<Case>(`/api/admin/cases/${id}`);
  return response.data;
}

export async function createCase(data: CreateCaseRequest): Promise<Case> {
  const response = await apiClient.post<Case>('/api/admin/cases', data);
  return response.data;
}

export async function updateCase(id: string, data: UpdateCaseRequest): Promise<Case> {
  const response = await apiClient.put<Case>(`/api/admin/cases/${id}`, data);
  return response.data;
}

export async function startTestSession(caseId: string): Promise<GameSession> {
  const response = await apiClient.post<GameSession>(`/api/admin/cases/${caseId}/test-session`);
  return response.data;
}

export async function publishCase(id: string): Promise<Case> {
  const response = await apiClient.post<Case>(`/api/admin/cases/${id}/publish`);
  return response.data;
}

export async function unpublishCase(id: string): Promise<Case> {
  const response = await apiClient.post<Case>(`/api/admin/cases/${id}/unpublish`);
  return response.data;
}

export async function getNextCaseCode(): Promise<string> {
  const res = await apiClient.get<{ code: string }>('/api/admin/cases/next-code');
  return res.data.code;
}

/**
 * Обновление настроек карты дела (фон, размеры, entry-location).
 * Использует общий PUT /api/admin/cases/{id}.
 */
export async function updateCaseMapSettings(
  caseId: string,
  data: {
    mapMediaId?: string | null;
    entryLocationId?: string | null;
    mapWidth?: number;
    mapHeight?: number;
  }
): Promise<Case> {
  const response = await apiClient.put<Case>(`/api/admin/cases/${caseId}`, data);
  return response.data;
}

/* ============================================================
   Удаление кейса
   ============================================================ */

/** Сводка о зависимостях кейса перед удалением. */
export interface CaseDeleteInfo {
  caseId: string;
  caseCode: string;
  caseTitle: string;
  caseStatus: string;
  locations: number;
  evidences: number;
  characters: number;
  sessions: number;
}

/**
 * Информация о зависимостях кейса.
 * Что удалится каскадом и есть ли блокирующие сессии.
 */
export async function getCaseDeleteInfo(id: string): Promise<CaseDeleteInfo> {
  const res = await apiClient.get<CaseDeleteInfo>(
    `/api/admin/cases/${id}/delete-info`
  );
  return res.data;
}

/**
 * Удалить кейс. Backend вернёт 409, если у кейса есть сессии.
 */
export async function deleteCase(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/cases/${id}`);
}