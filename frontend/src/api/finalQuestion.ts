import { apiClient } from './client';
import type {
  FinalQuestion,
  FinalQuestionAdmin,
  CreateFinalQuestionRequest,
  FinalAnswerResult,
} from '../types/finalQuestion';

// ---------- Public (игрок) ----------

/** Получить финальный вопрос сессии. 204 если у кейса нет финала. */
export async function getSessionFinalQuestion(sessionId: string): Promise<FinalQuestion | null> {
  const response = await apiClient.get<FinalQuestion | ''>(
    `/api/sessions/${sessionId}/final/question`
  );
  if (!response.data || response.status === 204) return null;
  return response.data as FinalQuestion;
}

/** Отправить финальный ответ. */
export async function submitFinalAnswer(
  sessionId: string,
  selectedOptionId: string
): Promise<FinalAnswerResult> {
  const response = await apiClient.post<FinalAnswerResult>(
    `/api/sessions/${sessionId}/final/submit`,
    { selectedOptionId }
  );
  return response.data;
}

/**
 * Объявить о начале финального ответа. Только владелец.
 * Остальные получат WS-событие FINAL_ANSWER_STARTED.
 */
export async function startFinalAnswer(sessionId: string): Promise<void> {
  await apiClient.post(`/api/sessions/${sessionId}/final/start`);
}

/** Получить результат после завершения. */
export async function getSessionFinalResult(sessionId: string): Promise<FinalAnswerResult> {
  const response = await apiClient.get<FinalAnswerResult>(
    `/api/sessions/${sessionId}/final/result`
  );
  return response.data;
}

// ---------- Admin ----------

export async function adminGetFinalQuestion(caseId: string): Promise<FinalQuestionAdmin | null> {
  const response = await apiClient.get<FinalQuestionAdmin | ''>(
    `/api/admin/cases/${caseId}/final-question`
  );
  if (!response.data || response.status === 204) return null;
  return response.data as FinalQuestionAdmin;
}

export async function adminSaveFinalQuestion(
  caseId: string,
  data: CreateFinalQuestionRequest
): Promise<FinalQuestionAdmin> {
  const response = await apiClient.post<FinalQuestionAdmin>(
    `/api/admin/cases/${caseId}/final-question`,
    data
  );
  return response.data;
}

export async function adminDeleteFinalQuestion(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/final-question/${id}`);
}