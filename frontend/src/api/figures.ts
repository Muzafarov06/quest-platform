import { apiClient } from './client';
import type { Figure } from '../types/figure';

export async function getFigures(): Promise<Figure[]> {
  const response = await apiClient.get<Figure[]>('/api/figures');
  return response.data;
}

// ---------- Admin ----------

export async function adminListFigures(): Promise<Figure[]> {
  const response = await apiClient.get<Figure[]>('/api/admin/figures');
  return response.data;
}

export async function adminCreateFigure(data: {
  label: string;
  fallbackEmoji?: string;
  sortOrder?: number;
  file?: File;
}): Promise<Figure> {
  const form = new FormData();
  form.append('label', data.label);
  if (data.fallbackEmoji) form.append('fallbackEmoji', data.fallbackEmoji);
  if (data.sortOrder != null) form.append('sortOrder', String(data.sortOrder));
  if (data.file) form.append('file', data.file);

  const response = await apiClient.post<Figure>('/api/admin/figures', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function adminUpdateFigure(
  id: string,
  data: {
    label?: string;
    fallbackEmoji?: string;
    sortOrder?: number;
    file?: File;
  }
): Promise<Figure> {
  const form = new FormData();
  if (data.label) form.append('label', data.label);
  if (data.fallbackEmoji) form.append('fallbackEmoji', data.fallbackEmoji);
  if (data.sortOrder != null) form.append('sortOrder', String(data.sortOrder));
  if (data.file) form.append('file', data.file);

  const response = await apiClient.patch<Figure>(
    `/api/admin/figures/${id}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}

export async function adminToggleFigure(id: string, active: boolean): Promise<Figure> {
  const response = await apiClient.patch<Figure>(
    `/api/admin/figures/${id}/active`,
    null,
    { params: { active } }
  );
  return response.data;
}

export async function adminDeleteFigure(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/figures/${id}`);
}