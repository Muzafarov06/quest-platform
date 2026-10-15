import { useCallback } from 'react';
import { useSessionSocket } from './useSessionSocket';
import type {
  SessionSocketEvent,
  BoardItemMovedEvent,
  BoardNoteUpdatedEvent,
} from '../types/socket';

interface Callbacks {
  onItemMoved?: (event: BoardItemMovedEvent) => void;
  onNoteUpdated?: (event: BoardNoteUpdatedEvent) => void;
}

export function useBoardSocket(
  sessionId: string | null | undefined,
  onItemsChanged: () => void,
  callbacks: Callbacks = {}
) {
  const { onItemMoved, onNoteUpdated } = callbacks;

  const handler = useCallback(
    (event: SessionSocketEvent) => {
      if (
        event.type === 'BOARD_ITEM_ADDED' ||
        event.type === 'BOARD_ITEM_REMOVED'
      ) {
        onItemsChanged();
        return;
      }
      if (event.type === 'BOARD_ITEM_MOVED') {
        onItemMoved?.(event);
        return;
      }
      if (event.type === 'BOARD_NOTE_UPDATED') {
        onNoteUpdated?.(event);
      }
    },
    [onItemsChanged, onItemMoved, onNoteUpdated]
  );

  useSessionSocket(sessionId, handler, !!sessionId);
}