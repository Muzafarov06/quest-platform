import { useState } from 'react';
import type { GameEvent } from '../types/action';
import { takeEvidence } from '../api/inventory';

interface Props {
  event: GameEvent;
  sessionId: string;
  onClose: () => void;
  onTaken?: () => void;
}

export function EventModal({ event, sessionId, onClose, onTaken }: Props) {
  const [isTaking, setIsTaking] = useState(false);
  const [taken, setTaken] = useState(false);
  const [takeError, setTakeError] = useState<string | null>(null);

  const canTake = event.eventType === 'REVEAL_EVIDENCE' && event.targetId && !taken;

  const handleTake = async () => {
    if (!event.targetId) return;
    setIsTaking(true);
    setTakeError(null);
    try {
      await takeEvidence(sessionId, event.targetId);
      setTaken(true);
      onTaken?.();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setTakeError(apiError.response?.data?.message ?? 'Не удалось взять улику');
    } finally {
      setIsTaking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">
          {event.eventType}
        </div>
        <p className="text-slate-800 text-lg whitespace-pre-line mb-6">
          {event.message ?? 'Событие без сообщения.'}
        </p>

        {takeError && (
          <div className="mb-3 px-3 py-2 bg-red-100 text-red-800 rounded text-sm">
            {takeError}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {canTake && (
            <button
              onClick={handleTake}
              disabled={isTaking}
              className="w-full px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isTaking ? 'Беру...' : 'Взять улику'}
            </button>
          )}

          {taken && (
            <div className="text-center text-green-700 text-sm">
              ✓ Улика в вашей сумке
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}