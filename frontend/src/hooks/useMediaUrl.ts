import { useEffect, useState } from 'react';
import { getMedia } from '../api/media';

/**
 * Получает presigned URL для медиа по id.
 * Возвращает null пока идёт загрузка или если id = null.
 */
export function useMediaUrl(mediaId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!mediaId) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    getMedia(mediaId)
      .then((info) => {
        if (!cancelled) setUrl(info.url);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [mediaId]);

  return url;
}