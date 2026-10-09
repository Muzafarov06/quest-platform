import { useEffect, useRef } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { SessionSocketEvent } from '../types/socket';

const WS_URL = 'http://localhost:8080/ws';

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