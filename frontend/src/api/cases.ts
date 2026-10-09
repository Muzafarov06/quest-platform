import { apiClient } from './client';
import type { Case } from '../types/case';

/**
 * Список опубликованных кейсов.
 * Требует JWT (интерцептор добавит автоматически).
 */
export async function getCases(): Promise<Case[]> {
  const response = await apiClient.get<Case[]>('/api/cases');
  return response.data;
}

/**
 * Кейс по ID.
 * 404 если не найден — бросит AxiosError.
 */
export async function getCase(id: string): Promise<Case> {
  const response = await apiClient.get<Case>(`/api/cases/${id}`);
  return response.data;
}