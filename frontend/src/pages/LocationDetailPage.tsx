import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getLocation } from '../api/locations';
import { getObjectsByLocation } from '../api/objects';
import { getConnectionsFrom } from '../api/connections';
import { MediaImage } from '../components/MediaImage';
import type { Location, LocationType } from '../types/location';
import type { GameObject, GameObjectType } from '../types/object';
import type { LocationConnection } from '../types/connection';
import type { ApiErrorResponse } from '../types/api';

const locationIcon: Record<LocationType, string> = {
  HOUSE: '🏠',
  ROOM: '🚪',
  STREET: '🛣️',
  FOREST: '🌲',
  VEHICLE: '🚗',
  DIGITAL: '💻',
  BUILDING: '🏢',
  OTHER: '📍',
};

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

export function LocationDetailPage() {
  const { caseId, locationId } = useParams<{ caseId: string; locationId: string }>();
  const navigate = useNavigate();

  const [location, setLocation] = useState<Location | null>(null);
  const [objects, setObjects] = useState<GameObject[] | null>(null);
  const [connections, setConnections] = useState<LocationConnection[] | null>(null);
  const [connectedLocations, setConnectedLocations] = useState<Map<string, Location>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!caseId || !locationId) return;

    setIsLoading(true);
    setError(null);

    Promise.all([
      getLocation(locationId),
      getObjectsByLocation(locationId),
      getConnectionsFrom(locationId),
    ])
      .then(async ([locResponse, objectsResponse, connectionsResponse]) => {
        setLocation(locResponse);
        setObjects(objectsResponse);
        setConnections(connectionsResponse);

        const targetIds = Array.from(new Set(connectionsResponse.map((c) => c.toLocationId)));
        const targets = await Promise.all(targetIds.map((id) => getLocation(id)));
        const map = new Map<string, Location>();
        targets.forEach((l) => map.set(l.id, l));
        setConnectedLocations(map);
      })
      .catch((err: unknown) => {
        const apiError = err as { response?: { data?: ApiErrorResponse } };
        setError(apiError.response?.data?.message ?? 'Не удалось загрузить локацию.');
      })
      .finally(() => setIsLoading(false));
  }, [caseId, locationId]);

  const handleObjectClick = (objectId: string) => {
    navigate(`/cases/${caseId}/locations/${locationId}/objects/${objectId}`);
  };

  if (isLoading) {
    return <div className="text-slate-500">Загрузка...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="text-red-700 mb-4">{error}</div>
        <Link to={`/cases/${caseId}`} className="text-blue-600 hover:underline">
          ← Назад к кейсу
        </Link>
      </div>
    );
  }

  if (!location) {
    return null;
  }

  return (
    <div>
      <Link to={`/cases/${caseId}`} className="text-blue-600 hover:underline text-sm">
        ← Назад к кейсу
      </Link>

      <div className="mt-4 bg-white rounded-lg shadow-sm overflow-hidden">
        {location.mediaId && (
          <MediaImage
            mediaId={location.mediaId}
            alt={location.name}
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-6 flex items-start gap-4">
          <span className="text-4xl" aria-hidden="true">
            {locationIcon[location.locationType]}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
              {location.locationType}
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-3">
              {location.name}
            </h1>
            {location.description && (
              <p className="text-slate-700 whitespace-pre-line">
                {location.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">
          Переходы{' '}
          {connections && (
            <span className="text-slate-400 text-lg">({connections.length})</span>
          )}
        </h2>

        {!connections || connections.length === 0 ? (
          <p className="text-slate-500">Из этой локации переходов нет.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {connections.map((c) => {
              const target = connectedLocations.get(c.toLocationId);
              if (!target) return null;
              return (
                <Link
                  key={c.id}
                  to={`/cases/${caseId}/locations/${target.id}`}
                  className="block bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">
                      {locationIcon[target.locationType]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-500 mb-0.5">
                        {c.label ?? 'Перейти'}
                      </div>
                      <div className="font-semibold text-slate-800 truncate">
                        {target.name}
                      </div>
                    </div>
                    <span className="text-slate-400">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">
          Объекты{' '}
          {objects && (
            <span className="text-slate-400 text-lg">({objects.length})</span>
          )}
        </h2>

        {!objects || objects.length === 0 ? (
          <p className="text-slate-500">В этой локации объектов нет.</p>
        ) : (
          <div className="space-y-2">
            {objects.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => handleObjectClick(o.id)}
                className="w-full text-left bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-start gap-3 cursor-pointer"
              >
                {o.mediaId ? (
                  <MediaImage
                    mediaId={o.mediaId}
                    alt={o.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <span className="text-2xl" aria-hidden="true">
                    {objectIcon[o.objectType]}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-slate-800">{o.name}</h3>
                    <span className="text-xs text-slate-400">{o.state}</span>
                  </div>
                  {o.description && (
                    <p className="text-sm text-slate-600 mt-1">{o.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}