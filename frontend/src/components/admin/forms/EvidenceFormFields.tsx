import { useEffect, useState } from 'react';
import { Field } from '../../ui/Field';
import { INPUT_PAPER } from '../../ui/inputStyles';
import { Select, type SelectOption } from '../../ui/Select';
import { MediaUploader } from '../MediaUploader';
import { NumberInput } from '../../ui/NumberInput';
import { adminListLocations } from '../../../api/locations';
import { adminListObjects } from '../../../api/objects';
import type { Location } from '../../../types/location';
import type { GameObject } from '../../../types/object';
import type {
  EvidenceType,
  EvidenceImportance,
} from '../../../types/evidence';

const EVIDENCE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'DOCUMENT', label: '📄 Документ' },
  { value: 'PHOTO', label: '🖼 Фото' },
  { value: 'AUDIO', label: '🎵 Аудио' },
  { value: 'VIDEO', label: '🎬 Видео' },
  { value: 'PHYSICAL', label: '🔪 Физическая' },
  { value: 'DIGITAL', label: '💾 Цифровая' },
  { value: 'TESTIMONY', label: '💬 Показания' },
  { value: 'OTHER', label: '📌 Другое' },
];

const IMPORTANCE_OPTIONS: SelectOption[] = [
  { value: 'KEY', label: '🔴 Ключевая' },
  { value: 'SUPPORTING', label: '🔵 Подкрепляющая' },
  { value: 'RED_HERRING', label: '⚪ Ложный след' },
];

export interface EvidenceFormValue {
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
  value: EvidenceFormValue;
  onChange: (patch: Partial<EvidenceFormValue>) => void;
  /** Скрыть селектор локации/объекта (например, когда предзаполнено из сцены). */
  hidePlacement?: boolean;
  /** Показать контекст: «Улика объекта X в локации Y» вместо селектов. */
  presetContext?: {
    locationName?: string;
    objectName?: string;
  };
}

/**
 * Общие поля формы улики. Используется в EvidenceModal.
 */
export function EvidenceFormFields({
  caseId,
  value,
  onChange,
  hidePlacement = false,
  presetContext,
}: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [objects, setObjects] = useState<GameObject[]>([]);

  useEffect(() => {
    let cancelled = false;
    adminListLocations(caseId)
      .then((locs) => {
        if (cancelled) return;
        setLocations(locs);
        return Promise.all(
          locs.map((l) => adminListObjects(l.id).catch(() => [] as GameObject[]))
        );
      })
      .then((arrays) => {
        if (cancelled || !arrays) return;
        setObjects(arrays.flat());
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const locationOptions: SelectOption[] = [
    { value: '', label: '— не привязана —' },
    ...locations.map((l) => ({ value: l.id, label: l.name })),
  ];

  const objectOptions: SelectOption[] = (() => {
    const list = value.locationId
      ? objects.filter((o) => o.locationId === value.locationId)
      : objects;
    return [
      { value: '', label: '— не привязан —' },
      ...list.map((o) => ({ value: o.id, label: o.name })),
    ];
  })();

  return (
    <>
      <Field label="Название" required variant="paper">
        <input
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
          required
          maxLength={200}
          placeholder="Пролаз в сад"
          className={INPUT_PAPER}
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Тип" variant="paper">
          <Select
            value={value.evidenceType}
            onChange={(v) => onChange({ evidenceType: v as EvidenceType })}
            options={EVIDENCE_TYPE_OPTIONS}
            variant="paper"
          />
        </Field>

        <Field label="Важность" variant="paper">
          <Select
            value={value.importance}
            onChange={(v) => onChange({ importance: v as EvidenceImportance })}
            options={IMPORTANCE_OPTIONS}
            variant="paper"
          />
        </Field>
      </div>

      <Field label="Краткое описание" hint="Видно в списке улик. Не спойлерит." variant="paper">
        <textarea
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
          className={INPUT_PAPER + ' resize-none'}
        />
      </Field>

      <Field
        label="Текст улики"
        hint="Что игрок увидит, открыв улику."
        variant="paper"
      >
        <textarea
          value={value.contentText}
          onChange={(e) => onChange({ contentText: e.target.value })}
          rows={5}
          className={INPUT_PAPER + ' resize-none'}
        />
      </Field>

      {!hidePlacement && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Локация" hint="Где находится — для контекста." variant="paper">
            <Select
              value={value.locationId ?? ''}
              onChange={(v) =>
                onChange({ locationId: v || null, objectId: null })
              }
              options={locationOptions}
              variant="paper"
            />
          </Field>

          <Field label="Объект" hint="Клик на этот объект откроет улику." variant="paper">
            <Select
              value={value.objectId ?? ''}
              onChange={(v) => onChange({ objectId: v || null })}
              options={objectOptions}
              variant="paper"
              disabled={!value.locationId && objects.length === 0}
            />
          </Field>
        </div>
      )}

      {hidePlacement && presetContext && (
        <div className="border-l-2 border-brass/60 pl-4 py-1">
          <div className="type text-[10px] uppercase tracking-[0.28em] text-brass mb-2">
            Привязка
          </div>
          {presetContext.locationName && (
            <div className="text-bone text-[13px]">
              📍 {presetContext.locationName}
            </div>
          )}
          {presetContext.objectName && (
            <div className="text-bone text-[13px]">
              🔍 {presetContext.objectName}
            </div>
          )}
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

      <div className="pt-4 border-t border-ink-text/20">
        <MediaUploader
          caseId={caseId}
          value={value.mediaId}
          onChange={(id) => onChange({ mediaId: id })}
          label="Изображение улики"
          hint="Фото документа, отпечатка, скриншот. Соотношение 1:1."
          aspect="square"
        />
      </div>
    </>
  );
}