import { useState } from 'react';
import { AdminPaperModal } from '../AdminPaperModal';
import {
  EvidenceFormFields,
  type EvidenceFormValue,
} from '../forms/EvidenceFormFields';
import type {
  Evidence,
  EvidenceType,
  EvidenceImportance,
} from '../../../types/evidence';
import type { ApiErrorResponse } from '../../../types/api';

export interface EvidenceModalSaveData {
  title: string;
  description: string;
  contentText: string;
  evidenceType: EvidenceType;
  importance: EvidenceImportance;
  locationId: string | null;
  objectId: string | null;
  mediaId: string | null;
  sortOrder: number;
}

interface Props {
  caseId: string;
  /** Если задано — режим редактирования. */
  initial?: Evidence | null;
  /** Предзаполненная привязка (для создания из сцены/объекта). */
  presetLocationId?: string | null;
  presetObjectId?: string | null;
  /** Контекстные имена для заголовка «Привязка». */
  presetContext?: {
    locationName?: string;
    objectName?: string;
  };
  onSave: (data: EvidenceModalSaveData) => Promise<void>;
  onClose: () => void;
}

const empty: EvidenceFormValue = {
  title: '',
  description: '',
  contentText: '',
  evidenceType: 'DOCUMENT',
  importance: 'SUPPORTING',
  locationId: null,
  objectId: null,
  mediaId: null,
  sortOrder: 0,
};

export function EvidenceModal({
  caseId,
  initial = null,
  presetLocationId = null,
  presetObjectId = null,
  presetContext,
  onSave,
  onClose,
}: Props) {
  const isEdit = !!initial;

  const [form, setForm] = useState<EvidenceFormValue>(() => {
    if (initial) {
      return {
        title: initial.title,
        description: initial.description ?? '',
        contentText: initial.contentText ?? '',
        evidenceType: initial.evidenceType,
        importance: initial.importance,
        locationId: initial.locationId,
        objectId: initial.objectId,
        mediaId: initial.mediaId,
        sortOrder: initial.sortOrder,
      };
    }
    return {
      ...empty,
      locationId: presetLocationId,
      objectId: presetObjectId,
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Введите название');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim(),
        contentText: form.contentText.trim(),
        evidenceType: form.evidenceType,
        importance: form.importance,
        locationId: form.locationId,
        objectId: form.objectId,
        mediaId: form.mediaId,
        sortOrder: form.sortOrder,
      });
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось сохранить');
      setIsSaving(false);
    }
  };

  return (
    <AdminPaperModal
      title="Карточка улики"
      stamp={isEdit ? 'Правка' : 'Новая'}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={isEdit ? 'Сохранить' : 'Создать улику'}
      isSaving={isSaving}
      error={error}
      maxWidth="max-w-3xl"
    >
      <EvidenceFormFields
        caseId={caseId}
        value={form}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        hidePlacement={!isEdit && (!!presetLocationId || !!presetObjectId)}
        presetContext={presetContext}
      />
    </AdminPaperModal>
  );
}