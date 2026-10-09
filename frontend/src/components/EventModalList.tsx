import { useState } from 'react';
import type { GameEvent } from '../types/action';
import { EventModal } from './EventModal';

interface Props {
  events: GameEvent[];
  sessionId: string;
  onAllClosed: () => void;
  onEvidenceTaken?: () => void;
}

export function EventModalList({ events, sessionId, onAllClosed, onEvidenceTaken }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (events.length === 0) {
    return null;
  }

  const handleClose = () => {
    const next = currentIndex + 1;
    if (next >= events.length) {
      onAllClosed();
    } else {
      setCurrentIndex(next);
    }
  };

  const currentEvent = events[currentIndex];
  if (!currentEvent) {
    return null;
  }

  return (
    <EventModal
      event={currentEvent}
      sessionId={sessionId}
      onClose={handleClose}
      onTaken={onEvidenceTaken}
    />
  );
}