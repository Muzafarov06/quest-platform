import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getObject } from '../api/objects';
import { getEvidencesByObject } from '../api/evidences';
import type { GameObject, GameObjectType } from '../types/object';
import type { Evidence, EvidenceType } from '../types/evidence';
import type { ApiErrorResponse } from '../types/api';

const objectIcon: Record<GameObjectType, string> = {
  TELEPHONE: '📱',
  COMPUTER: '💻',
  DOOR: '🚪',
  SAFE: '🔒',
  CONTAINER: '📦',
  DOCUMENT: '📄',
  ITEM: '🔍',
  OTHER: '❓',
  INTERROGATION_PHONE: '📞',  // ← ИСПРАВЛЕНО: добавлен отсутствующий ключ
};

const evidenceIcon: Record<EvidenceType, string> = {
  DOCUMENT: '📄',
  PHOTO: '🖼️',
  AUDIO: '🎵',
  VIDEO: '🎬',
  PHYSICAL: '🔪',
  DIGITAL: '💾',
  TESTIMONY: '💬',
  OTHER: '📌',
};

export function ObjectDetailPage() {
  const { caseId, locationId, objectId } = useParams<{
    caseId: string;
    locationId: string;
    objectId: string;
  }>();

  const [object, setObject] = useState<GameObject | null>(null);
  const [evidences, setEvidences] = useState<Evidence[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!objectId) return;

    setIsLoading(true);
    setError(null);

    Promise.all([getObject(objectId), getEvidencesByObject(objectId)])
      .then(([objResponse, evidencesResponse]) => {
        setObject(objResponse);
        setEvidences(evidencesResponse);
      })
      .catch((err: unknown) => {
        const apiError = err as { response?: { data?: ApiErrorResponse } };
        setError(apiError.response?.data?.message ?? 'Не удалось загрузить объект.');
      })
      .finally(() => setIsLoading(false));
  }, [objectId]);

  const backLink = locationId
    ? `/cases/${caseId}/locations/${locationId}`
    : `/cases/${caseId}`;

  if (isLoading) {
    return <div className="text-slate-500">Загрузка...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="text-red-700 mb-4">{error}</div>
        <Link to={backLink} className="text-blue-600 hover:underline">
          ← Назад
        </Link>
      </div>
    );
  }

  if (!object) {
    return null;
  }

  return (
    <div>
      <Link to={backLink} className="text-blue-600 hover:underline text-sm">
        ← Назад
      </Link>

      <div className="mt-4 bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-start gap-4">
          <span className="text-4xl" aria-hidden="true">
            {objectIcon[object.objectType]}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
              {object.objectType} · {object.state}
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-3">
              {object.name}
            </h1>
            {object.description && (
              <p className="text-slate-700 whitespace-pre-line">
                {object.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">
          Улики{' '}
          {evidences && (
            <span className="text-slate-400 text-lg">({evidences.length})</span>
          )}
        </h2>

        {!evidences || evidences.length === 0 ? (
          <p className="text-slate-500">Через этот объект улик пока не найдено.</p>
        ) : (
          <div className="space-y-3">
            {evidences.map((e) => (
              <div
                key={e.id}
                className="bg-white p-4 rounded-lg shadow-sm flex items-start gap-3"
              >
                <span className="text-2xl" aria-hidden="true">
                  {evidenceIcon[e.evidenceType]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-800">{e.title}</h3>
                    <span
                      className={
                        'text-xs px-2 py-0.5 rounded ' +
                        (e.importance === 'KEY'
                          ? 'bg-red-100 text-red-800'
                          : e.importance === 'SUPPORTING'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600')
                      }
                    >
                      {e.importance}
                    </span>
                  </div>
                  {e.description && (
                    <p className="text-sm text-slate-600 mt-1">{e.description}</p>
                  )}
                  {e.contentText && (
                    <p className="text-sm text-slate-700 mt-2 italic border-l-2 border-slate-200 pl-3">
                      {e.contentText}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}