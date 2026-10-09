import { apiClient } from './client';
import type { Evidence, EvidenceType, EvidenceImportance } from '../types/evidence';

// ---------- Public ----------

export async function getEvidencesByCase(caseId: string): Promise<Evidence[]> {
  const response = await apiClient.get<Evidence[]>(`/api/cases/${caseId}/evidences`);
  return response.data;
}

export async function getEvidencesByObject(objectId: string): Promise<Evidence[]> {
  const response = await apiClient.get<Evidence[]>(`/api/objects/${objectId}/evidences`);
  return response.data;
}

export async function getEvidencesByLocation(locationId: string): Promise<Evidence[]> {
  const response = await apiClient.get<Evidence[]>(`/api/locations/${locationId}/evidences`);
  return response.data;
}

export async function getEvidence(id: string): Promise<Evidence> {
  const response = await apiClient.get<Evidence>(`/api/evidences/${id}`);
  return response.data;
}

// ---------- Admin ----------

export interface CreateEvidenceRequest {
  title: string;
  description?: string;
  contentText?: string;
  evidenceType: EvidenceType;
  importance: EvidenceImportance;
  objectId?: string | null;
  locationId?: string | null;
  mediaId?: string | null;
  sortOrder?: number;
}

export interface UpdateEvidenceRequest {
  title: string;
  description?: string;
  contentText?: string;
  evidenceType: EvidenceType;
  importance: EvidenceImportance;
  objectId?: string | null;
  locationId?: string | null;
  mediaId?: string | null;
  sortOrder: number;
}

export async function adminListEvidences(caseId: string): Promise<Evidence[]> {
  const response = await apiClient.get<Evidence[]>(
    `/api/admin/cases/${caseId}/evidences`
  );
  return response.data;
}

export async function adminCreateEvidence(
  caseId: string,
  data: CreateEvidenceRequest
): Promise<Evidence> {
  const response = await apiClient.post<Evidence>(
    `/api/admin/cases/${caseId}/evidences`,
    data
  );
  return response.data;
}

export async function adminUpdateEvidence(
  id: string,
  data: UpdateEvidenceRequest
): Promise<Evidence> {
  const response = await apiClient.put<Evidence>(`/api/admin/evidences/${id}`, data);
  return response.data;
}

export async function adminDeleteEvidence(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/evidences/${id}`);
}