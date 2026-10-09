import { useMemo, useState } from 'react';
import { AdminPaperModal } from '../AdminPaperModal';
import {
  CharacterFormFields,
  type CharacterFormValue,
} from '../forms/CharacterFormFields';
import {
  DialogModal,
  type DialogModalSaveData,
} from './DialogModal';
import {
  adminAddDialog,
  adminUpdateDialog,
  adminDeleteDialog,
  adminListCharacters,
} from '../../../api/characters';
import type {
  CharacterAdmin,
  CharacterDialog,
  CharacterUnlockMode,
} from '../../../types/character';
import type { ApiErrorResponse } from '../../../types/api';

export interface CharacterModalSaveData {
  name: string;
  description: string;
  biography: string;
  locationId: string | null;
  portraitMediaId: string | null;
  dialogueMediaId: string | null;
  sortOrder: number;
  unlockMode: CharacterUnlockMode;
  unlockTargetId: string | null;
}

interface Props {
  caseId: string;
  initial?: CharacterAdmin | null;
  presetLocationId?: string | null;
  presetLocationName?: string;
  onSave: (data: CharacterModalSaveData) => Promise<void>;
  onClose: () => void;
}

const empty: CharacterFormValue = {
  name: '',
  description: '',
  biography: '',
  locationId: null,
  portraitMediaId: null,
  dialogueMediaId: null,
  sortOrder: 0,
  unlockMode: 'AUTO',
  unlockTargetId: null,
};

type Tab = 'main' | 'dialogs';
type DialogModalState = 'new' | { id: string } | null;

export function CharacterModal({
  caseId,
  initial = null,
  presetLocationId = null,
  presetLocationName,
  onSave,
  onClose,
}: Props) {
  const isEdit = !!initial;
  const isPreset = !isEdit && !!presetLocationId;

  const [tab, setTab] = useState<Tab>('main');

  const [form, setForm] = useState<CharacterFormValue>(() => {
    if (initial) {
      return {
        name: initial.name,
        description: initial.description ?? '',
        biography: initial.biography ?? '',
        locationId: initial.locationId,
        portraitMediaId: initial.portraitMediaId,
        dialogueMediaId: initial.dialogueMediaId,
        sortOrder: initial.sortOrder,
        unlockMode: initial.unlockMode ?? 'AUTO',
        unlockTargetId: initial.unlockTargetId,
      };
    }
    return { ...empty, locationId: presetLocationId };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogs, setDialogs] = useState<CharacterDialog[]>(
    initial?.dialogs ?? []
  );
  const [dialogModal, setDialogModal] = useState<DialogModalState>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const editingDialog = useMemo(() => {
    if (!dialogModal || dialogModal === 'new') return null;
    return dialogs.find((d) => d.id === dialogModal.id) ?? null;
  }, [dialogModal, dialogs]);

  const handleSaveMain = async () => {
    if (!form.name.trim()) {
      setError('Введите имя');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        name: form.name.trim(),
        description: form.description.trim(),
        biography: form.biography.trim(),
        locationId: form.locationId,
        portraitMediaId: form.portraitMediaId,
        dialogueMediaId: form.dialogueMediaId,
        sortOrder: form.sortOrder,
        unlockMode: form.unlockMode,
        unlockTargetId: form.unlockTargetId,
      });
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось сохранить');
      setIsSaving(false);
    }
  };

  const handleSaveDialog = async (data: DialogModalSaveData) => {
    if (!initial) return;

    setDialogError(null);
    const common = {
      question: data.question,
      answer: data.answer,
      requiresEvidenceId: data.requiresEvidenceId,
      sortOrder: data.sortOrder,
    };

    try {
      let updated: CharacterAdmin | null = null;
      if (dialogModal === 'new') {
        updated = await adminAddDialog(initial.id, common);
      } else if (dialogModal) {
        updated = await adminUpdateDialog(dialogModal.id, common);
      }
      if (updated) setDialogs(updated.dialogs);
      setDialogModal(null);
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      throw new Error(
        apiError.response?.data?.message ?? 'Не удалось сохранить диалог'
      );
    }
  };

  const handleDeleteDialog = async (dialogId: string) => {
    if (!initial) return;
    if (!confirm('Удалить диалог?')) return;

    setDialogError(null);
    try {
      await adminDeleteDialog(dialogId);
      const all = await adminListCharacters(caseId);
      const refreshed = all.find((c) => c.id === initial.id);
      if (refreshed) setDialogs(refreshed.dialogs);
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setDialogError(
        apiError.response?.data?.message ?? 'Не удалось удалить диалог'
      );
    }
  };

  return (
    <>
      <AdminPaperModal
        title="Карточка персонажа"
        stamp={isEdit ? 'Правка' : 'Новый'}
        onClose={onClose}
        onSave={tab === 'main' ? handleSaveMain : undefined}
        saveLabel={isEdit ? 'Сохранить' : 'Создать персонажа'}
        isSaving={isSaving}
        error={error}
        maxWidth="max-w-3xl"
      >
        {isEdit && (
          <div className="flex gap-1 -mb-2 border-b border-ink-text/20">
            <TabButton
              active={tab === 'main'}
              onClick={() => setTab('main')}
              label="Карточка"
            />
            <TabButton
              active={tab === 'dialogs'}
              onClick={() => setTab('dialogs')}
              label={`Диалоги · ${dialogs.length}`}
            />
          </div>
        )}

        {tab === 'main' && (
          <CharacterFormFields
            caseId={caseId}
            value={form}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            hideLocation={isPreset}
            presetLocationName={presetLocationName}
          />
        )}

        {tab === 'dialogs' && isEdit && (
          <DialogsSection
            dialogs={dialogs}
            error={dialogError}
            onCreate={() => setDialogModal('new')}
            onEdit={(d) => setDialogModal({ id: d.id })}
            onDelete={handleDeleteDialog}
          />
        )}
      </AdminPaperModal>

      {dialogModal && initial && (
        <DialogModal
          characterName={initial.name}
          initial={editingDialog}
          onSave={handleSaveDialog}
          onClose={() => setDialogModal(null)}
        />
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'px-4 py-2 -mb-px border-b-2 transition-colors ' +
        'type text-[11px] uppercase tracking-[0.24em] cursor-pointer ' +
        (active
          ? 'border-blood text-blood'
          : 'border-transparent text-ink-text-dim hover:text-ink-text')
      }
    >
      {label}
    </button>
  );
}

function DialogsSection({
  dialogs,
  error,
  onCreate,
  onEdit,
  onDelete,
}: {
  dialogs: CharacterDialog[];
  error: string | null;
  onCreate: () => void;
  onEdit: (d: CharacterDialog) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="type text-[11px] uppercase tracking-[0.28em] text-ink-text-dim">
          Диалоги · {dialogs.length}
        </span>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2
                     bg-blood text-paper px-4 py-2
                     type text-[11px] uppercase tracking-[0.22em]
                     hover:bg-blood-hover transition-colors cursor-pointer"
        >
          + Добавить диалог
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 bg-blood/15 border-l-4 border-blood
                        type text-[12px] text-blood">
          {error}
        </div>
      )}

      {dialogs.length === 0 ? (
        <p className="type text-[12px] text-ink-text-dim italic">
          Диалогов пока нет. Персонаж молчит.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {dialogs.map((d) => (
            <li
              key={d.id}
              className="border border-ink-text/20 bg-black/[0.04] px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 text-lg" aria-hidden="true">❓</span>
                <div className="flex-1 min-w-0">
                  <div className="type text-[10px] uppercase tracking-[0.24em]
                                  text-ink-text-dim mb-1">
                    Игрок спрашивает
                  </div>
                  <div className="font-poster text-[15px] text-ink-text
                                  leading-snug">
                    {d.question}
                  </div>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEdit(d)}
                    className="px-2.5 py-1 border border-ink-text/30
                               text-ink-text-dim
                               type text-[10px] uppercase tracking-[0.2em]
                               hover:text-ink-text hover:border-ink-text/60
                               transition-colors cursor-pointer"
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(d.id)}
                    className="w-7 h-7 flex items-center justify-center
                               border border-blood/40 text-blood
                               type text-[12px]
                               hover:bg-blood/10 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 mt-3 pt-3
                              border-t border-ink-text/15">
                <span className="shrink-0 text-lg" aria-hidden="true">💬</span>
                <div className="flex-1 min-w-0">
                  <div className="type text-[10px] uppercase tracking-[0.24em]
                                  text-ink-text-dim mb-1">
                    Персонаж отвечает
                  </div>
                  <div className="text-ink-text-soft text-[13px]
                                  whitespace-pre-line leading-relaxed">
                    {d.answer}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="type text-[11px] text-ink-text-dim italic mt-1">
        Диалоги сохраняются сразу — кнопку «Сохранить» жать не нужно.
      </p>
    </div>
  );
}