import { useState } from 'react';
import { AdminPaperModal } from '../AdminPaperModal';
import {
  LocationFormFields,
  type LocationFormValue,
} from '../forms/LocationFormFields';
import type {
  Location,
  LocationType,
  DiscoveryMode,
} from '../../../types/location';
import type { ApiErrorResponse } from '../../../types/api';

export interface LocationModalSaveData {
  name: string;
  description: string;
  locationType: LocationType;
  parentId: string | null;
  mediaId: string | null;
  previewMediaId: string | null;
  mapMediaId: string | null;
  sortOrder: number;
  discoveryMode: DiscoveryMode;
  discoveryTargetId: string | null;
  discoveryHint: string;
}

interface Props {
  caseId: string;
  locations: Location[];
  initial?: Location | null;
  defaultParentId?: string | null;
  evidences?: { id: string; label: string }[];
  characters?: { id: string; label: string }[];
  onSave: (data: LocationModalSaveData) => Promise<void>;
  onClose: () => void;
}

const empty: LocationFormValue = {
  name: '',
  description: '',
  locationType: 'ROOM',
  parentId: null,
  mediaId: null,
  previewMediaId: null,
  mapMediaId: null,
  sortOrder: 0,
  discoveryMode: 'ALWAYS',
  discoveryTargetId: null,
  discoveryHint: '',
};

export function LocationModal({
  caseId,
  locations,
  initial = null,
  defaultParentId = null,
  evidences = [],
  characters = [],
  onSave,
  onClose,
}: Props) {
  const isEdit = !!initial;

  const [form, setForm] = useState<LocationFormValue>(() => {
    if (initial) {
      return {
        name: initial.name,
        description: initial.description ?? '',
        locationType: initial.locationType,
        parentId: initial.parentId,
        mediaId: initial.mediaId,
        previewMediaId: initial.previewMediaId,
        mapMediaId: initial.mapMediaId,
        sortOrder: initial.sortOrder,
        discoveryMode: initial.discoveryMode,
        discoveryTargetId: initial.discoveryTargetId,
        discoveryHint: initial.discoveryHint ?? '',
      };
    }
    return { ...empty, parentId: defaultParentId };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Введите название');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        name: form.name.trim(),
        description: form.description.trim(),
        locationType: form.locationType,
        parentId: form.parentId,
        mediaId: form.mediaId,
        previewMediaId: form.previewMediaId,
        mapMediaId: form.mapMediaId,
        sortOrder: form.sortOrder,
        discoveryMode: form.discoveryMode,
        discoveryTargetId:
          form.discoveryMode === 'ALWAYS' || form.discoveryMode === 'ON_MANUAL'
            ? null
            : form.discoveryTargetId,
        discoveryHint: form.discoveryHint.trim(),
      });
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось сохранить');
      setIsSaving(false);
    }
  };

  return (
    <AdminPaperModal
      title="Карточка локации"
      stamp={isEdit ? 'Правка' : 'Новая'}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={isEdit ? 'Сохранить' : 'Создать локацию'}
      isSaving={isSaving}
      error={error}
      maxWidth="max-w-2xl"
    >
      <LocationFormFields
        caseId={caseId}
        value={form}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        locations={locations}
        evidences={evidences}
        characters={characters}
        excludeLocationId={initial?.id}
      />
    </AdminPaperModal>
  );
}