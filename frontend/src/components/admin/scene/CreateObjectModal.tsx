import { useState, type FormEvent } from 'react';
import { MediaUploader } from '../MediaUploader';
import { NumberInput } from '../../ui/NumberInput';
import { Select } from '../../ui/Select';
import type {
  GameObjectType,
  GameObjectState,
} from '../../../types/object';

const OBJECT_TYPES: GameObjectType[] = [
  'TELEPHONE', 'INTERROGATION_PHONE', 'COMPUTER', 'DOOR', 'SAFE',
  'CONTAINER', 'DOCUMENT', 'ITEM', 'OTHER',
];

const TYPE_LABEL: Record<GameObjectType, string> = {
  TELEPHONE: '📱 Телефон',
  INTERROGATION_PHONE: '☎️ Телефон для вызова',
  COMPUTER: '💻 Компьютер',
  DOOR: '🚪 Дверь',
  SAFE: '🔒 Сейф',
  CONTAINER: '📦 Контейнер',
  DOCUMENT: '📄 Документ',
  ITEM: '🔍 Предмет',
  OTHER: '❓ Другое',
};

const STATES: GameObjectState[] = ['CLOSED', 'OPEN', 'LOCKED', 'BROKEN'];

const STATE_LABEL: Record<GameObjectState, string> = {
  CLOSED: 'Закрыт',
  OPEN: 'Открыт',
  LOCKED: 'Заперт',
  BROKEN: 'Сломан',
};

const INPUT =
  'w-full bg-transparent border-b-2 border-ink-text/40 text-ink-text ' +
  'placeholder:text-ink-text-dim/70 focus:outline-none focus:border-blood ' +
  'font-type text-base px-0 py-2 transition-colors';

interface Props {
  caseId: string;
  onSave: (data: {
    name: string;
    description: string;
    objectType: GameObjectType;
    state: GameObjectState;
    mediaId: string | null;
    sortOrder: number;
  }) => Promise<void>;
  onClose: () => void;
}

export function CreateObjectModal({ caseId, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [objectType, setObjectType] = useState<GameObjectType>('ITEM');
  const [state, setState] = useState<GameObjectState>('CLOSED');
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Введите название');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        objectType,
        state,
        mediaId,
        sortOrder,
      });
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message ?? 'Не удалось сохранить');
      setIsSaving(false);
    }
  };

  const typeOptions = OBJECT_TYPES.map((t) => ({
    value: t,
    label: TYPE_LABEL[t],
  }));

  const stateOptions = STATES.map((s) => ({
    value: s,
    label: STATE_LABEL[s],
  }));

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6
                 bg-ink/85 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />

        <form
          onSubmit={handleSubmit}
          className="paper paper-old p-6 md:p-8 relative flex flex-col gap-6"
        >
          <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
            <span className="stamp-red text-xs">Новый</span>
          </div>

          <div className="flex items-baseline justify-between pb-3
                          border-b border-ink-text/20">
            <span className="type text-[11px] uppercase tracking-[0.28em]
                             text-ink-text-soft">
              Карточка объекта
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center
                         text-ink-text-dim hover:text-blood text-lg
                         transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <Field label="Название" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={200}
              placeholder="Журнал диспетчера"
              className={INPUT}
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Тип">
              <Select
                value={objectType}
                onChange={(v) => setObjectType(v as GameObjectType)}
                options={typeOptions}
                variant="paper"
              />
            </Field>

            <Field label="Состояние">
              <Select
                value={state}
                onChange={(v) => setState(v as GameObjectState)}
                options={stateOptions}
                variant="paper"
              />
            </Field>
          </div>

          <Field label="Описание">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={INPUT + ' resize-none'}
            />
          </Field>

          <Field label="Порядок сортировки">
            <NumberInput
              value={sortOrder}
              onChange={(v) => setSortOrder(v === '' ? 0 : v)}
              min={0}
              className={INPUT}
              variant="paper"
            />
          </Field>

          <div className="pt-4 border-t border-ink-text/20">
            <MediaUploader
              caseId={caseId}
              value={mediaId}
              onChange={setMediaId}
              label="Спрайт объекта"
              hint="PNG с прозрачностью. Не обязательно."
              aspect="square"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-blood/15 border-l-4 border-blood
                            type text-[13px] text-blood">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-3 border border-ink-text/40 text-ink-text
                         type text-[12px] uppercase tracking-[0.24em]
                         hover:border-ink-text/70 hover:bg-black/5
                         transition-colors cursor-pointer disabled:opacity-40"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blood text-paper px-6 py-3
                         type text-[12px] uppercase tracking-[0.24em]
                         hover:bg-blood-hover transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? 'Создаём…' : 'Создать объект'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="type text-[11px] uppercase tracking-[0.24em]
                       text-ink-text-dim">
        {label}
        {required && <span className="text-blood ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}