import { useState } from 'react';
import { Link } from 'react-router-dom';
import { addBoardItem } from '../api/board';
import type { Evidence } from '../types/evidence';

interface Props {
  evidences: Evidence[];
  sessionId?: string;
  onAddedToBoard?: () => void;
}

export function InventoryPanel({ evidences, sessionId, onAddedToBoard }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddToBoard = async (evidence: Evidence) => {
    if (!sessionId) return;
    setBusyId(evidence.id);
    setError(null);
    try {
      await addBoardItem(sessionId, {
        itemType: 'EVIDENCE',
        evidenceId: evidence.id,
        title: evidence.title,
        content: evidence.contentText ?? evidence.description ?? undefined,
      });
      onAddedToBoard?.();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message ?? 'Не удалось добавить на доску');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <aside className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
        Инвентарь ({evidences.length})
      </h3>

      {error && (
        <div className="mb-2 px-2 py-1.5 bg-red-100 text-red-800 rounded text-xs">
          {error}
        </div>
      )}

      {evidences.length === 0 ? (
        <p className="text-slate-500 text-sm">
          Сумка пуста. Осматривайте объекты и берите улики.
        </p>
      ) : (
        <ul className="space-y-2">
          {evidences.map((e) => (
            <li key={e.id} className="text-sm">
              <Link
                to={`/evidences/${e.id}`}
                className="block px-3 py-2 rounded hover:bg-slate-50 transition-colors"
              >
                <div className="font-medium text-slate-800 truncate">
                  {e.title}
                </div>
                <div className="text-xs text-slate-500">{e.evidenceType}</div>
              </Link>
              {sessionId && (
                <button
                  onClick={() => handleAddToBoard(e)}
                  disabled={busyId === e.id}
                  className="mt-1 w-full px-2 py-1 text-xs bg-slate-800 text-white rounded hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {busyId === e.id ? 'Добавляем...' : '📌 На доску'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}