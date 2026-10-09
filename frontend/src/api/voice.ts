import { apiClient } from './client';

export interface VoiceTokenResponse {
  url: string;
  token: string;
  roomName: string;
  identity: string;
}

export async function getVoiceToken(sessionId: string): Promise<VoiceTokenResponse> {
  const response = await apiClient.post<VoiceTokenResponse>(
    `/api/sessions/${sessionId}/voice/token`
  );
  return response.data;
}