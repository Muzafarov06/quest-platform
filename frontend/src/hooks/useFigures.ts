import { useEffect, useState } from 'react';
import { getFigures } from '../api/figures';
import type { Figure } from '../types/figure';

let cache: Figure[] | null = null;
const listeners = new Set<(f: Figure[]) => void>();

export function useFigures(): Figure[] | null {
  const [figures, setFigures] = useState<Figure[] | null>(cache);

  useEffect(() => {
    if (cache) return;

    getFigures()
      .then((list) => {
        cache = list;
        listeners.forEach((fn) => fn(list));
      })
      .catch(() => {
        cache = [];
        listeners.forEach((fn) => fn([]));
      });
  }, []);

  useEffect(() => {
    const fn = (f: Figure[]) => setFigures(f);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  return figures;
}

/** Сбросить кеш — вызывать после изменения фигурок в админке. */
export function invalidateFiguresCache() {
  cache = null;
}