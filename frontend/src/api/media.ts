import { apiClient } from './client';

export interface MediaInfo {
  id: string;
  caseId: string;
  originalName: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  url: string;
  createdAt: string;
}

export async function getMedia(id: string): Promise<MediaInfo> {
  const response = await apiClient.get<MediaInfo>(`/api/media/${id}`);
  return response.data;
}

/** Список медиа кейса — каждый с presigned URL. */
export async function listCaseMedia(caseId: string): Promise<MediaInfo[]> {
  const response = await apiClient.get<MediaInfo[]>(`/api/cases/${caseId}/media`);
  return response.data;
}

/** Загрузка файла в кейс. Только ADMIN. */
export async function uploadCaseMedia(caseId: string, file: File): Promise<MediaInfo> {
  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.post<MediaInfo>(
    `/api/admin/cases/${caseId}/media`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}

/** Удаление медиа. Только ADMIN. */
export async function deleteCaseMedia(mediaId: string): Promise<void> {
  await apiClient.delete(`/api/admin/media/${mediaId}`);
}