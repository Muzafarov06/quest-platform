import { useState, type FormEvent } from 'react';
import { MediaUploader } from '../MediaUploader';
import { NumberInput } from '../../ui/NumberInput';

const INPUT =
  'w-full bg-transparent border-b-2 border-ink-text/40 text-ink-text ' +
  'placeholder:text-ink-text-dim/70 focus:outline-none focus:border-blood ' +
  'font-type text-base px-0 py-2 transition-colors';

interface Props {
  caseId: string;
  onSave: (data: {
    name: string;
    description: string;
    biography: string;
    portraitMediaId: string | null;
    sortOrder: number;
  }) => Promise<void>;
  onClose: () => void;
}

export function CreateCharacterModal({ caseId, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [biography, setBiography] = useState('');
  const [portraitMediaId, setPortraitMediaId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Введите имя');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        biography: biography.trim(),
        portraitMediaId,
        sortOrder,
      });
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message ?? 'Не удалось сохранить');
      setIsSaving(false);
    }
  };

  return (
    <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6
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
              Карточка персонажа
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

          <Field label="Имя" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={200}
              placeholder="Дэниел Уитмор"
              className={INPUT}
              autoFocus
            />
          </Field>

          <Field label="Описание для игрока" hint="Что видно при встрече.">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={INPUT + ' resize-none'}
            />
          </Field>

          <Field
            label="Биография"
            hint="Только для админа. Мотивация, алиби, что скрывает."
          >
            <textarea
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              rows={4}
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
              value={portraitMediaId}
              onChange={setPortraitMediaId}
              label="Портрет"
              hint="Соотношение 3:4. Не обязательно."
              aspect="portrait"
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
              {isSaving ? 'Создаём…' : 'Создать персонажа'}
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
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="type text-[11px] uppercase tracking-[0.24em]
                       text-ink-text-dim">
        {label}
        {required && <span className="text-blood ml-1">*</span>}
      </span>
      {children}
      {hint && <span className="type text-[10px] text-ink-text-dim">{hint}</span>}
    </label>
  );
}