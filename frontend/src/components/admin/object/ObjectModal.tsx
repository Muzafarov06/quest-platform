import { useState } from 'react';
import { AdminPaperModal } from '../AdminPaperModal';
import {
  ObjectFormFields,
  type ObjectFormValue,
} from '../forms/ObjectFormFields';
import type { GameObject, GameObjectRenderLayer } from '../../../types/object';
import type { ApiErrorResponse } from '../../../types/api';

export interface ObjectModalSaveData {
  name: string;
  description: string;
  objectType: GameObject['objectType'];
  state: GameObject['state'];
  mediaId: string | null;
  sortOrder: number;
  renderLayer: GameObjectRenderLayer;
  walkable: boolean;
}

interface Props {
  caseId: string;
  initial?: GameObject | null;
  onSave: (data: ObjectModalSaveData) => Promise<void>;
  onClose: () => void;
}

const empty: ObjectFormValue = {
  name: '',
  description: '',
  objectType: 'ITEM',
  state: 'CLOSED',
  mediaId: null,
  sortOrder: 0,
  renderLayer: 0,
  walkable: false,
};

export function ObjectModal({
  caseId,
  initial = null,
  onSave,
  onClose,
}: Props) {
  const isEdit = !!initial;

  const [form, setForm] = useState<ObjectFormValue>(() =>
    initial
      ? {
          name: initial.name,
          description: initial.description ?? '',
          objectType: initial.objectType,
          state: initial.state,
          mediaId: initial.mediaId,
          sortOrder: initial.sortOrder,
          renderLayer: initial.renderLayer ?? 0,
          walkable: initial.walkable ?? false,
        }
      : empty
  );

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
        objectType: form.objectType,
        state: form.state,
        mediaId: form.mediaId,
        sortOrder: form.sortOrder,
        renderLayer: form.renderLayer,
        walkable: form.walkable,
      });
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось сохранить');
      setIsSaving(false);
    }
  };

  return (
    <AdminPaperModal
      title="Карточка объекта"
      stamp={isEdit ? 'Правка' : 'Новый'}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={isEdit ? 'Сохранить' : 'Создать объект'}
      isSaving={isSaving}
      error={error}
      maxWidth="max-w-2xl"
    >
      <ObjectFormFields
        caseId={caseId}
        value={form}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
      />
    </AdminPaperModal>
  );
}