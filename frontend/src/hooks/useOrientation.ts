import { useEffect, useState } from 'react';

/**
 * Определяет ориентацию и признак мобильного устройства.
 *
 * Реактивно — при повороте телефона состояние обновляется.
 */
export function useOrientation() {
  const getIsPortrait = () =>
    typeof window !== 'undefined'
      ? window.matchMedia('(orientation: portrait)').matches
      : false;

  const getIsMobile = () =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 900px)').matches
      : false;

  const [isPortrait, setIsPortrait] = useState(getIsPortrait);
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const portraitMq = window.matchMedia('(orientation: portrait)');
    const mobileMq = window.matchMedia('(max-width: 900px)');

    const onPortrait = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    const onMobile = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    portraitMq.addEventListener('change', onPortrait);
    mobileMq.addEventListener('change', onMobile);

    // Синхронизация на случай, если MQ изменился до подписки
    setIsPortrait(portraitMq.matches);
    setIsMobile(mobileMq.matches);

    return () => {
      portraitMq.removeEventListener('change', onPortrait);
      mobileMq.removeEventListener('change', onMobile);
    };
  }, []);

  return { isPortrait, isMobile };
}