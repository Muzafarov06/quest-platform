import { apiClient } from './client';
import type { GameEvent, EventType } from '../types/action';

export type ConditionType =
  | 'OBJECT_INTERACTED'
  | 'LOCATION_VISITED'
  | 'EVIDENCE_DISCOVERED'
  | 'PUZZLE_SOLVED';

export interface ConditionWithEvents {
  id: string;
  caseId: string;
  conditionType: ConditionType;
  targetId: string | null;
  createdAt: string;
  events: GameEvent[];
}

export interface CreateConditionRequest {
  conditionType: ConditionType;
  targetId?: string | null;
}

export interface CreateGameEventRequest {
  eventType: EventType;
  targetId?: string | null;
  message?: string;
  once?: boolean;
  sortOrder?: number;
}

export interface UpdateGameEventRequest {
  eventType: EventType;
  targetId?: string | null;
  message?: string;
  once: boolean;
  sortOrder: number;
}

// ---------- Public ----------

export async function getEventsByCase(caseId: string): Promise<GameEvent[]> {
  const response = await apiClient.get<GameEvent[]>(`/api/cases/${caseId}/events`);
  return response.data;
}

// ---------- Admin ----------

export async function adminListConditions(caseId: string): Promise<ConditionWithEvents[]> {
  const response = await apiClient.get<ConditionWithEvents[]>(
    `/api/admin/cases/${caseId}/conditions`
  );
  return response.data;
}

export async function adminCreateCondition(
  caseId: string,
  data: CreateConditionRequest
): Promise<ConditionWithEvents> {
  const response = await apiClient.post<ConditionWithEvents>(
    `/api/admin/cases/${caseId}/conditions`,
    data
  );
  return response.data;
}

export async function adminUpdateCondition(
  id: string,
  data: CreateConditionRequest
): Promise<ConditionWithEvents> {
  const response = await apiClient.put<ConditionWithEvents>(
    `/api/admin/conditions/${id}`,
    data
  );
  return response.data;
}

export async function adminDeleteCondition(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/conditions/${id}`);
}

export async function adminCreateEvent(
  conditionId: string,
  data: CreateGameEventRequest
): Promise<GameEvent> {
  const response = await apiClient.post<GameEvent>(
    `/api/admin/conditions/${conditionId}/events`,
    data
  );
  return response.data;
}

export async function adminUpdateEvent(
  id: string,
  data: UpdateGameEventRequest
): Promise<GameEvent> {
  const response = await apiClient.put<GameEvent>(`/api/admin/events/${id}`, data);
  return response.data;
}

export async function adminDeleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/events/${id}`);
}