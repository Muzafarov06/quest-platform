import { useEffect, useState } from 'react';
import { adminListEvidences, adminDeleteEvidence, adminUpdateEvidence, adminCreateEvidence } from '../../api/evidences';
import { adminListLocations } from '../../api/locations';
import { adminListObjects } from '../../api/objects';
import { EvidenceModal, type EvidenceModalSaveData } from '../../components/admin/evidence/EvidenceModal';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import type { Evidence, EvidenceImportance } from '../../types/evidence';
import type { Location } from '../../types/location';
import type { GameObject } from '../../types/object';
import type { ApiErrorResponse } from '../../types/api';

const IMPORTANCE_BADGE: Record<EvidenceImportance, string> = {
  KEY: 'bg-blood/20 text-blood border-blood/50',
  SUPPORTING: 'bg-brass/15 text-brass border-brass/40',
  RED_HERRING: 'bg-bone/10 text-bone-muted border-bone/25',
};

const IMPORTANCE_LABEL: Record<EvidenceImportance, string> = {
  KEY: 'Ключевая',
  SUPPORTING: 'Подкрепляющая',
  RED_HERRING: 'Ложный след',
};

interface Props {
  caseId: string;
}

export function AdminEvidencesTab({ caseId }: Props) {
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState<false | 'new' | { id: string }>(false);

  const reload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [evList, locList] = await Promise.all([
        adminListEvidences(caseId),
        adminListLocations(caseId),
      ]);
      setEvidences(evList);
      setLocations(locList);
      const objArrays = await Promise.all(
        locList.map((l) => adminListObjects(l.id).catch(() => []))
      );
      setObjects(objArrays.flat());
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось загрузить улики.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const handleSave = async (data: EvidenceModalSaveData) => {
    if (modalOpen === 'new') {
      await adminCreateEvidence(caseId, {
        title: data.title,
        description: data.description || undefined,
        contentText: data.contentText || undefined,
        evidenceType: data.evidenceType,
        importance: data.importance,
        locationId: data.locationId,
        objectId: data.objectId,
        mediaId: data.mediaId,
        sortOrder: data.sortOrder,
      });
    } else if (modalOpen) {
      await adminUpdateEvidence(modalOpen.id, {
        title: data.title,
        description: data.description || undefined,
        contentText: data.contentText || undefined,
        evidenceType: data.evidenceType,
        importance: data.importance,
        locationId: data.locationId,
        objectId: data.objectId,
        mediaId: data.mediaId,
        sortOrder: data.sortOrder,
      });
    }
    setModalOpen(false);
    await reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить улику?')) return;
    try {
      await adminDeleteEvidence(id);
      await reload();
    } catch {
      alert('Не удалось удалить');
    }
  };

  const locationName = (id: string | null) =>
    id ? locations.find((l) => l.id === id)?.name ?? null : null;

  const objectName = (id: string | null) =>
    id ? objects.find((o) => o.id === id)?.name ?? null : null;

  if (isLoading) {
    return (
      <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted py-8">
        Загружаем улики…
      </div>
    );
  }
  if (error) {
    return (
      <div className="border border-blood/40 bg-blood/10 p-5 max-w-2xl">
        <div className="type text-[12px] uppercase tracking-[0.28em] text-blood mb-2">
          Ошибка
        </div>
        <div className="text-bone text-base">{error}</div>
      </div>
    );
  }

  const editingEvidence =
    modalOpen && modalOpen !== 'new'
      ? evidences.find((e) => e.id === modalOpen.id) ?? null
      : null;

  return (
    <div>
      {/* Шапка */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="type text-[11px] uppercase tracking-[0.28em] text-bone-muted mb-1">
            Улики дела
          </div>
          <div className="font-poster text-2xl text-bone">
            {evidences.length} шт.
          </div>
        </div>

        <button
          onClick={() => setModalOpen('new')}
          className="inline-flex items-center gap-2
                     bg-blood text-paper px-5 py-3
                     type text-[12px] uppercase tracking-[0.24em]
                     hover:bg-blood-hover transition-colors cursor-pointer"
        >
          + Добавить улику
        </button>
      </div>

      {/* Список */}
      {evidences.length === 0 ? (
        <div className="border border-bone/20 p-8 max-w-2xl">
          <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted mb-2">
            Пока пусто
          </div>
          <div className="text-bone">Добавьте первую улику.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {evidences.map((e) => (
            <div
              key={e.id}
              className="border border-brass/25 bg-ink/60 backdrop-blur-sm
                         p-3 sm:p-4
                         flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
            >
              {/* Превью или логотип */}
              <div className="w-full sm:w-32 md:w-40
                              h-32 md:h-40 shrink-0
                              flex items-center justify-center overflow-hidden
                              -my-1 sm:my-0">
                <EvidenceThumb mediaId={e.mediaId} alt={e.title} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-1.5 flex-wrap">
                  <span className="font-poster text-lg md:text-xl text-bone leading-tight">
                    {e.title}
                  </span>
                  <span
                    className={
                      'type text-[10px] uppercase tracking-[0.22em] ' +
                      'px-2 py-0.5 border ' + IMPORTANCE_BADGE[e.importance]
                    }
                  >
                    {IMPORTANCE_LABEL[e.importance]}
                  </span>
                </div>

                <div className="type text-[11px] text-bone-muted flex flex-wrap gap-3">
                  <span className="text-brass">{e.evidenceType}</span>
                  {e.locationId && <span>📍 {locationName(e.locationId)}</span>}
                  {e.objectId && <span>🔍 {objectName(e.objectId)}</span>}
                  {e.mediaId && <span>🖼 картинка</span>}
                </div>

                {e.contentText && (
                  <p className="text-[13px] text-bone-muted mt-2 italic line-clamp-2">
                    {e.contentText}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0
                              w-full sm:w-auto
                              pt-2 sm:pt-0
                              border-t border-brass/15 sm:border-0">
                <button
                  onClick={() => setModalOpen({ id: e.id })}
                  className="flex-1 sm:flex-initial
                             px-3 py-2 sm:py-1.5
                             border border-bone/25 text-bone-muted
                             type text-[11px] uppercase tracking-[0.2em]
                             hover:text-bone hover:border-bone/60
                             transition-colors cursor-pointer"
                >
                  Изменить
                </button>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="flex-1 sm:flex-initial
                             px-3 py-2 sm:py-1.5
                             border border-blood/40 text-blood
                             type text-[11px] uppercase tracking-[0.2em]
                             hover:bg-blood/10 transition-colors cursor-pointer"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модалка */}
      {modalOpen !== false && (
        <EvidenceModal
          caseId={caseId}
          initial={editingEvidence}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function EvidenceThumb({
  mediaId,
  alt,
}: {
  mediaId: string | null;
  alt: string;
}) {
  const url = useMediaUrl(mediaId);
  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        draggable={false}
        className="max-w-full max-h-full object-contain select-none
                   drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
      />
    );
  }
  return (
    <img
      src="/images/logo.png"
      alt=""
      draggable={false}
      className="w-20 h-20 md:w-28 md:h-28 object-contain select-none
                 pointer-events-none opacity-60"
    />
  );
}