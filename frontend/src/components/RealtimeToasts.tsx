import { useEffect, useRef, useState } from 'react';
import type { SessionSocketEvent } from '../types/socket';

interface ToastItem {
  id: string;
  text: string;
  kind: 'info' | 'evidence' | 'location';
  /** Когда создан — миллисекунды. */
  createdAt: number;
}

interface Props {
  event: SessionSocketEvent | null;
}

const KIND_CLASS: Record<ToastItem['kind'], string> = {
  info: 'border-bone/30 text-bone',
  evidence: 'border-brass/60 text-brass',
  location: 'border-blood/60 text-blood',
};

const TTL_MS = 3200;

/**
 * Показывает всплывающие сообщения о действиях других игроков.
 * Каждое живёт TTL_MS миллисекунд и исчезает.
 *
 * Удаление — через отдельный интервал, чтобы не зависеть от cleanup'ов
 * useEffect, которые раньше отменяли таймер при каждом новом событии.
 */
export function RealtimeToasts({ event }: Props) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seenRef = useRef<SessionSocketEvent | null>(null);

  /* Добавление нового тоста при получении события. */
  useEffect(() => {
    if (!event) return;
    if (seenRef.current === event) return;
    seenRef.current = event;

    const parsed = describeEvent(event);
    if (!parsed) return;

    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [
      ...prev,
      { id, text: parsed.text, kind: parsed.kind, createdAt: Date.now() },
    ]);
  }, [event]);

  /* Сборщик просроченных — раз в 400 мс. */
  useEffect(() => {
    if (toasts.length === 0) return;
    const interval = window.setInterval(() => {
      const now = Date.now();
      setToasts((prev) => prev.filter((t) => now - t.createdAt < TTL_MS));
    }, 400);
    return () => window.clearInterval(interval);
  }, [toasts.length]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[120] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            'pointer-events-auto px-4 py-2.5 bg-ink/95 backdrop-blur-sm ' +
            'border-2 animate-fade-in ' +
            'type text-[11px] uppercase tracking-[0.2em] max-w-xs ' +
            KIND_CLASS[t.kind]
          }
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.85)' }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

function describeEvent(
  event: SessionSocketEvent
): { text: string; kind: ToastItem['kind'] } | null {
  switch (event.type) {
    case 'PLAYER_ENTERED_LOCATION':
      return { text: `🚶 ${event.playerName} → ${event.locationName}`, kind: 'info' };
    case 'PLAYER_INTERACTED':
      return { text: `🔍 ${event.playerName} осмотрел: ${event.objectName}`, kind: 'info' };
    case 'PLAYER_LEFT':
      return { text: `👋 ${event.playerName} покинул сессию`, kind: 'info' };
    case 'PLAYER_JOINED':
      return { text: `✚ ${event.playerName} присоединился`, kind: 'info' };
    case 'LOCATION_UNLOCKED':
      return {
        text: event.hint
          ? `📍 ${event.hint}`
          : `📍 Открыта локация: ${event.locationName}`,
        kind: 'location',
      };
    case 'EVIDENCE_TAKEN':
      return { text: `🔎 ${event.playerName} нашёл: ${event.evidenceTitle}`, kind: 'evidence' };
    case 'SESSION_STARTED':
      return { text: '🔔 Расследование началось', kind: 'location' };
    case 'SESSION_FINISHED':
      return { text: '🔔 Дело закрыто', kind: 'location' };
    case 'GAME_EVENT':
      return null;
    default:
      return null;
  }
}