import { useCallback } from 'react';
import { useSessionSocket } from './useSessionSocket';
import type { SessionSocketEvent } from '../types/socket';

export function useBoardSocket(
  sessionId: string | null | undefined,
  onItemsChanged: () => void
) {
  const handler = useCallback(
    (event: SessionSocketEvent) => {
      if (
        event.type === 'BOARD_ITEM_ADDED' ||
        event.type === 'BOARD_ITEM_REMOVED'
      ) {
        onItemsChanged();
      }
    },
    [onItemsChanged]
  );

  useSessionSocket(sessionId, handler, !!sessionId);
}