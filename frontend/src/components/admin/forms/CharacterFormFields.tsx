import { useEffect, useState } from 'react';
import { Field } from '../../ui/Field';
import { INPUT_PAPER } from '../../ui/inputStyles';
import { Select, type SelectOption } from '../../ui/Select';
import { MediaUploader } from '../MediaUploader';
import { NumberInput } from '../../ui/NumberInput';
import { adminListLocations } from '../../../api/locations';
import { adminListEvidences } from '../../../api/evidences';
import type { Location } from '../../../types/location';
import type { Evidence } from '../../../types/evidence';
import type { CharacterUnlockMode } from '../../../types/character';

const UNLOCK_MODE_OPTIONS: SelectOption[] = [
  { value: 'AUTO',            label: 'Авто (по локации персонажа)' },
  { value: 'ALWAYS',          label: 'Всегда доступен' },
  { value: 'LOCATION_OPENED', label: 'После открытия локации' },
  { value: 'EVIDENCE_FOUND',  label: 'После находки улики' },
];

export interface CharacterFormValue {
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
  value: CharacterFormValue;
  onChange: (patch: Partial<CharacterFormValue>) => void;
  hideLocation?: boolean;
  presetLocationName?: string;
}

export function CharacterFormFields({
  caseId,
  value,
  onChange,
  hideLocation = false,
  presetLocationName,
}: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);

  useEffect(() => {
    adminListLocations(caseId).then(setLocations).catch(() => {});
    adminListEvidences(caseId).then(setEvidences).catch(() => {});
  }, [caseId]);

  const locationOptions: SelectOption[] = [
    { value: '', label: '— не привязан —' },
    ...locations.map((l) => ({ value: l.id, label: l.name })),
  ];

  const targetOptions: SelectOption[] = (() => {
    if (value.unlockMode === 'LOCATION_OPENED') {
      return locations.map((l) => ({ value: l.id, label: l.name }));
    }
    if (value.unlockMode === 'EVIDENCE_FOUND') {
      return evidences.map((e) => ({ value: e.id, label: e.title }));
    }
    return [];
  })();

  const hasTarget = value.unlockMode === 'LOCATION_OPENED'
    || value.unlockMode === 'EVIDENCE_FOUND';

  return (
    <>
      <Field label="Имя" required variant="paper">
        <input
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          required
          maxLength={200}
          placeholder="Дэниел Уитмор"
          className={INPUT_PAPER}
          autoFocus
        />
      </Field>

      <Field
        label="Описание для игрока"
        hint="Что видно при встрече."
        variant="paper"
      >
        <textarea
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className={INPUT_PAPER + ' resize-none'}
        />
      </Field>

      <Field
        label="Биография"
        hint="Только для админа. Мотивация, алиби, что скрывает."
        variant="paper"
      >
        <textarea
          value={value.biography}
          onChange={(e) => onChange({ biography: e.target.value })}
          rows={4}
          className={INPUT_PAPER + ' resize-none'}
        />
      </Field>

      {!hideLocation && (
        <Field label="Локация" variant="paper">
          <Select
            value={value.locationId ?? ''}
            onChange={(v) => onChange({ locationId: v || null })}
            options={locationOptions}
            variant="paper"
          />
        </Field>
      )}

      {hideLocation && presetLocationName && (
        <div className="border-l-2 border-brass/60 pl-4 py-1">
          <div className="type text-[10px] uppercase tracking-[0.28em] text-brass mb-2">
            Локация
          </div>
          <div className="text-bone text-[13px]">📍 {presetLocationName}</div>
        </div>
      )}

      <Field label="Порядок сортировки" variant="paper">
        <NumberInput
          value={value.sortOrder}
          onChange={(v) => onChange({ sortOrder: v === '' ? 0 : v })}
          min={0}
          className={INPUT_PAPER}
          variant="paper"
        />
      </Field>

      <div className="pt-5 border-t border-ink-text/20 flex flex-col gap-5">
        <div className="type text-[11px] uppercase tracking-[0.28em] text-blood">
          Когда доступен в «Вызове на допрос»
        </div>

        <Field
          label="Правило"
          hint="Если персонаж не привязан к локации — задайте, когда он может прийти в штаб."
          variant="paper"
        >
          <Select
            value={value.unlockMode}
            onChange={(v) =>
              onChange({
                unlockMode: v as CharacterUnlockMode,
                unlockTargetId: null,
              })
            }
            options={UNLOCK_MODE_OPTIONS}
            variant="paper"
          />
        </Field>

        {hasTarget && (
          <Field
            label={value.unlockMode === 'LOCATION_OPENED' ? 'Локация' : 'Улика'}
            required
            variant="paper"
          >
            <Select
              value={value.unlockTargetId ?? ''}
              onChange={(v) => onChange({ unlockTargetId: v || null })}
              options={[
                { value: '', label: '— выберите —' },
                ...targetOptions,
              ]}
              variant="paper"
            />
          </Field>
        )}
      </div>

      <div className="pt-4 border-t border-ink-text/20 flex flex-col gap-6">
        <MediaUploader
          caseId={caseId}
          value={value.portraitMediaId}
          onChange={(id) => onChange({ portraitMediaId: id })}
          label="Спрайт на сцене"
          hint="Фигурка на полу сцены. Соотношение 3:4. Не обязательно."
          aspect="portrait"
        />

        <MediaUploader
          caseId={caseId}
          value={value.dialogueMediaId}
          onChange={(id) => onChange({ dialogueMediaId: id })}
          label="Фотография для диалога"
          hint="Большая картинка в полный рост, показывается в окне разговора. Соотношение 3:4. Если пусто — используется спрайт."
          aspect="portrait"
        />
      </div>
    </>
  );
}