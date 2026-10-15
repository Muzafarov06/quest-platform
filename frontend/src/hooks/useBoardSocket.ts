import { useCallback } from 'react';
import { useSessionSocket } from './useSessionSocket';
import type {
  SessionSocketEvent,
  BoardItemMovedEvent,
  BoardNoteUpdatedEvent,
  BoardNoteTypingEvent,
} from '../types/socket';

interface Callbacks {
  onItemMoved?: (event: BoardItemMovedEvent) => void;
  onNoteUpdated?: (event: BoardNoteUpdatedEvent) => void;
  onNoteTyping?: (event: BoardNoteTypingEvent) => void;
}

export function useBoardSocket(
  sessionId: string | null | undefined,
  onItemsChanged: () => void,
  callbacks: Callbacks = {}
) {
  const { onItemMoved, onNoteUpdated, onNoteTyping } = callbacks;

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
        return;
      }
      if (event.type === 'BOARD_NOTE_TYPING') {
        onNoteTyping?.(event);
      }
    },
    [onItemsChanged, onItemMoved, onNoteUpdated, onNoteTyping]
  );

  return useSessionSocket(sessionId, handler, !!sessionId);
}