import { useEffect, useState } from 'react';

export interface ImageSize {
  width: number;
  height: number;
}

/**
 * Возвращает натуральные размеры картинки по её URL.
 * Пока картинка не загружена или URL пуст — null.
 */
export function useImageSize(
  url: string | null | undefined
): ImageSize | null {
  const [size, setSize] = useState<ImageSize | null>(null);

  useEffect(() => {
    if (!url) {
      setSize(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      if (!cancelled) setSize(null);
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);

  return size;
}