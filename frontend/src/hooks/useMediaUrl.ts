import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

function getApiBaseUrl(): string {
  const baseUrl = apiClient.defaults.baseURL;

  if (!baseUrl) {
    return '';
  }

  return baseUrl.replace(/\/$/, '');
}

/**
 * Возвращает URL файла через backend.
 * Backend сам скачивает файл из S3 и отдаёт его браузеру.
 */
export function useMediaUrl(mediaId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!mediaId) {
      setUrl(null);
      return;
    }

    setUrl(`${getApiBaseUrl()}/api/media/${mediaId}/file`);
  }, [mediaId]);

  return url;
}