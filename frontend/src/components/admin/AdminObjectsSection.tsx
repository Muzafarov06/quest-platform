import { useEffect, useMemo, useState } from 'react';
import {
  adminListObjects,
  adminCreateObject,
  adminUpdateObject,
  adminDeleteObject,
} from '../../api/objects';
import {
  ObjectModal,
  type ObjectModalSaveData,
} from './object/ObjectModal';
import type { GameObject } from '../../types/object';
import type { ApiErrorResponse } from '../../types/api';

interface Props {
  caseId: string;
  locationId: string;
}

type ModalState = 'new' | { id: string } | null;

export function AdminObjectsSection({ caseId, locationId }: Props) {
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  const reload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await adminListObjects(locationId);
      setObjects(list);
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось загрузить объекты.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  const editingObject = useMemo(() => {
    if (!modal || modal === 'new') return null;
    return objects.find((o) => o.id === modal.id) ?? null;
  }, [modal, objects]);

  const handleSave = async (data: ObjectModalSaveData) => {
    const common = {
      name: data.name,
      description: data.description || undefined,
      objectType: data.objectType,
      state: data.state,
      mediaId: data.mediaId,
      sortOrder: data.sortOrder,
      renderLayer: data.renderLayer,
      walkable: data.walkable,
    };
    if (modal === 'new') {
      await adminCreateObject(locationId, common);
    } else if (modal) {
      await adminUpdateObject(modal.id, common);
    }
    setModal(null);
    await reload();
  };

  const handleDelete = async (o: GameObject) => {
    if (!confirm(`Удалить объект "${o.name}"?`)) return;
    try {
      await adminDeleteObject(o.id);
      await reload();
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      alert(apiError.response?.data?.message ?? 'Не удалось удалить.');
    }
  };

  if (isLoading) {
    return (
      <div className="type text-[12px] uppercase tracking-[0.24em] text-bone-muted py-4">
        Загружаем объекты…
      </div>
    );
  }
  if (error) {
    return (
      <div className="border border-blood/40 bg-blood/10 p-4">
        <div className="type text-[11px] uppercase tracking-[0.24em] text-blood">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="type text-[11px] uppercase tracking-[0.26em] text-brass">
          Объекты · {objects.length}
        </div>
        <button
          onClick={() => setModal('new')}
          className="inline-flex items-center gap-2
                     bg-blood text-paper px-4 py-2
                     type text-[11px] uppercase tracking-[0.22em]
                     hover:bg-blood-hover transition-colors cursor-pointer"
        >
          + Объект
        </button>
      </div>

      {objects.length === 0 ? (
        <div className="type text-[12px] uppercase tracking-[0.24em] text-bone-muted py-4">
          Объектов нет. Добавьте первый.
        </div>
      ) : (
        <ul className="space-y-2">
          {objects.map((o) => (
            <li
              key={o.id}
              className="border border-brass/20 bg-ink/60 backdrop-blur-sm
                         px-3 py-2.5 flex items-center gap-3 flex-wrap"
            >
              <span className="text-xl shrink-0" aria-hidden="true">
                {iconForType(o.objectType)}
              </span>

              <div className="flex-1 min-w-0">
                <div className="font-poster text-base text-bone leading-tight truncate">
                  {o.name}
                </div>
                <div className="type text-[10px] uppercase tracking-[0.22em] text-bone-muted mt-0.5">
                  {o.objectType} · {o.state}
                  {o.mediaId && ' · 🖼'}
                  {' · '}
                  {Math.round(o.posX)}/{Math.round(o.posY)}
                  {' · слой '}
                  {o.renderLayer}
                  {o.walkable && ' · проходим'}
                </div>
              </div>

              <button
                onClick={() => setModal({ id: o.id })}
                className="px-2.5 py-1 border border-bone/25 text-bone-muted
                           type text-[10px] uppercase tracking-[0.2em]
                           hover:text-bone hover:border-bone/60
                           transition-colors cursor-pointer shrink-0"
              >
                Изменить
              </button>
              <button
                onClick={() => handleDelete(o)}
                className="w-7 h-7 flex items-center justify-center
                           border border-blood/40 text-blood
                           type text-[12px]
                           hover:bg-blood/10 transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <ObjectModal
          caseId={caseId}
          initial={editingObject}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function iconForType(type: GameObject['objectType']): string {
  switch (type) {
    case 'TELEPHONE': return '📱';
    case 'INTERROGATION_PHONE': return '☎️';
    case 'COMPUTER': return '💻';
    case 'DOOR': return '🚪';
    case 'SAFE': return '🔒';
    case 'CONTAINER': return '📦';
    case 'DOCUMENT': return '📄';
    case 'ITEM': return '🔍';
    case 'OTHER': return '❓';
  }
}