import { useEffect, useRef } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { SessionSocketEvent } from '../types/socket';

/**
 * URL WebSocket-сервера.
 *
 *   • В dev (localhost): http://localhost:8080/ws
 *   • В prod (HTTPS): берётся из VITE_WS_URL, например
 *     https://quest-backend.up.railway.app/ws
 *
 * Если VITE_WS_URL не задан и страница на HTTPS — не подключаемся,
 * чтобы не ловить mixed-content. Это осознанный fallback.
 */
const WS_URL: string | null = (() => {
  const fromEnv = import.meta.env.VITE_WS_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  if (typeof window === 'undefined') return 'http://localhost:8080/ws';
  return window.location.protocol === 'https:'
    ? null
    : 'http://localhost:8080/ws';
})();

export function useSessionSocket(
  sessionId: string | null | undefined,
  onEvent: (event: SessionSocketEvent) => void,
  enabled: boolean = true
) {
  const clientRef = useRef<Client | null>(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || !sessionId) return;
    if (!WS_URL) {
      console.warn(
        '[WS] VITE_WS_URL не задан, а страница на HTTPS — ' +
          'реалтайм выключен. Задай VITE_WS_URL в Vercel env.'
      );
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as unknown as WebSocket,
      reconnectDelay: 5000,
      debug: () => {
        // раскомментируй для отладки STOMP:
        // console.log('[STOMP]', msg);
      },
    });

    client.onConnect = () => {
      client.subscribe(`/topic/session/${sessionId}`, (message: IMessage) => {
        try {
          const event = JSON.parse(message.body) as SessionSocketEvent;
          onEventRef.current(event);
        } catch (err) {
          console.warn('[WS] JSON parse error', err, message.body);
        }
      });
    };

    client.onStompError = (frame) => {
      console.warn('[WS] STOMP error', frame.headers, frame.body);
    };

    client.onWebSocketError = (event) => {
      console.warn('[WS] WebSocket error', event);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [sessionId, enabled]);

  return clientRef;
}