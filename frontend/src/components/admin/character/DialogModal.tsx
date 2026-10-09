import { useState } from 'react';
import { AdminPaperModal } from '../AdminPaperModal';
import { Field } from '../../ui/Field';
import { INPUT_PAPER } from '../../ui/inputStyles';
import { NumberInput } from '../../ui/NumberInput';
import type { CharacterDialog } from '../../../types/character';
import type { ApiErrorResponse } from '../../../types/api';

export interface DialogModalSaveData {
  question: string;
  answer: string;
  requiresEvidenceId: string | null;
  sortOrder: number;
}

interface Props {
  /** Имя персонажа — для заголовка. */
  characterName: string;
  /** Если задано — режим редактирования. */
  initial?: CharacterDialog | null;
  onSave: (data: DialogModalSaveData) => Promise<void>;
  onClose: () => void;
}

/**
 * Единая модалка диалога персонажа: create / edit.
 * Используется в AdminCharactersTab.
 */
export function DialogModal({
  characterName,
  initial = null,
  onSave,
  onClose,
}: Props) {
  const isEdit = !!initial;

  const [question, setQuestion] = useState(initial?.question ?? '');
  const [answer, setAnswer] = useState(initial?.answer ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!question.trim()) {
      setError('Введите вопрос');
      return;
    }
    if (!answer.trim()) {
      setError('Введите ответ');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        question: question.trim(),
        answer: answer.trim(),
        requiresEvidenceId: initial?.requiresEvidenceId ?? null,
        sortOrder,
      });
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось сохранить');
      setIsSaving(false);
    }
  };

  return (
    <AdminPaperModal
      title={`Диалог · ${characterName}`}
      stamp={isEdit ? 'Правка' : 'Новый'}
      onClose={onClose}
      onSave={handleSave}
      saveLabel={isEdit ? 'Сохранить' : 'Создать диалог'}
      isSaving={isSaving}
      error={error}
      maxWidth="max-w-2xl"
    >
      <Field label="Вопрос игрока" required variant="paper">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          maxLength={2000}
          required
          autoFocus
          placeholder="Где вы были вечером?"
          className={INPUT_PAPER + ' resize-none'}
        />
      </Field>

      <Field label="Ответ персонажа" required variant="paper">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={5}
          maxLength={10000}
          required
          placeholder="Я был дома. Готовил ужин…"
          className={INPUT_PAPER + ' resize-none'}
        />
      </Field>

      <Field label="Порядок сортировки" variant="paper">
        <NumberInput
          value={sortOrder}
          onChange={(v) => setSortOrder(v === '' ? 0 : v)}
          min={0}
          className={INPUT_PAPER}
          variant="paper"
        />
      </Field>
    </AdminPaperModal>
  );
}