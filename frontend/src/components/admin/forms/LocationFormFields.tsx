import { Field } from '../../ui/Field';
import { INPUT_PAPER } from '../../ui/inputStyles';
import { Select, type SelectOption } from '../../ui/Select';
import { MediaUploader } from '../MediaUploader';
import { NumberInput } from '../../ui/NumberInput';
import type {
  Location,
  LocationType,
  DiscoveryMode,
} from '../../../types/location';

const LOCATION_TYPE_OPTIONS: SelectOption[] = [
  { value: 'HOUSE', label: '🏠 Дом' },
  { value: 'ROOM', label: '🚪 Комната' },
  { value: 'STREET', label: '🛣 Улица' },
  { value: 'FOREST', label: '🌲 Лес' },
  { value: 'VEHICLE', label: '🚗 Транспорт' },
  { value: 'DIGITAL', label: '💻 Цифровое' },
  { value: 'BUILDING', label: '🏢 Здание' },
  { value: 'OTHER', label: '📍 Другое' },
];

const DISCOVERY_OPTIONS: SelectOption[] = [
  { value: 'ALWAYS', label: 'Открыта сразу' },
  { value: 'ON_EVIDENCE', label: 'После находки улики' },
  { value: 'ON_LOCATION', label: 'После посещения локации' },
  { value: 'ON_DIALOG', label: 'После диалога' },
  { value: 'ON_MANUAL', label: 'Только вручную' },
];

export interface LocationFormValue {
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

export interface LocationFormOption {
  id: string;
  label: string;
}

interface Props {
  caseId: string;
  value: LocationFormValue;
  onChange: (patch: Partial<LocationFormValue>) => void;
  locations: Location[];
  evidences?: LocationFormOption[];
  characters?: LocationFormOption[];
  excludeLocationId?: string;
  hideParent?: boolean;
}

export function LocationFormFields({
  caseId,
  value,
  onChange,
  locations,
  evidences = [],
  characters = [],
  excludeLocationId,
  hideParent = false,
}: Props) {
  const parentOptions: SelectOption[] = [
    { value: '', label: '— верхний уровень (на карте)' },
    ...locations
      .filter((l) => l.id !== excludeLocationId)
      .map((l) => ({
        value: l.id,
        label: (l.parentId ? '   └ ' : '') + l.name,
      })),
  ];

  const targetOptions: SelectOption[] = (() => {
    switch (value.discoveryMode) {
      case 'ON_EVIDENCE':
        return evidences.map((e) => ({ value: e.id, label: e.label }));
      case 'ON_LOCATION':
        return locations
          .filter((l) => l.id !== excludeLocationId)
          .map((l) => ({ value: l.id, label: l.name }));
      case 'ON_DIALOG':
        return characters.map((c) => ({ value: c.id, label: c.label }));
      default:
        return [];
    }
  })();

  const targetLabel =
    value.discoveryMode === 'ON_EVIDENCE'
      ? 'После улики'
      : value.discoveryMode === 'ON_LOCATION'
      ? 'После локации'
      : value.discoveryMode === 'ON_DIALOG'
      ? 'После диалога'
      : '';

  const hasTarget =
    value.discoveryMode === 'ON_EVIDENCE' ||
    value.discoveryMode === 'ON_LOCATION' ||
    value.discoveryMode === 'ON_DIALOG';

  return (
    <>
      <Field label="Название" required variant="paper">
        <input
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          required
          maxLength={200}
          placeholder="Гостиная"
          className={INPUT_PAPER}
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Тип" variant="paper">
          <Select
            value={value.locationType}
            onChange={(v) => onChange({ locationType: v as LocationType })}
            options={LOCATION_TYPE_OPTIONS}
            variant="paper"
          />
        </Field>

        {!hideParent && (
          <Field label="Родительская локация" variant="paper">
            <Select
              value={value.parentId ?? ''}
              onChange={(v) => onChange({ parentId: v || null })}
              options={parentOptions}
              variant="paper"
            />
          </Field>
        )}
      </div>

      <Field label="Описание" variant="paper">
        <textarea
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className={INPUT_PAPER + ' resize-none'}
        />
      </Field>

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
          label="Фон сцены локации"
          hint="Что увидит игрок, войдя сюда. Не обязательно."
          aspect="video"
        />
      </div>

      <div className="pt-4 border-t border-ink-text/20">
        <MediaUploader
          caseId={caseId}
          value={value.previewMediaId}
          onChange={(id) => onChange({ previewMediaId: id })}
          label="Превью при клике"
          hint="Большая картинка на весь экран при клике на карту дела."
          aspect="video"
        />
      </div>

      <div className="pt-4 border-t border-ink-text/20">
        <MediaUploader
          caseId={caseId}
          value={value.mapMediaId}
          onChange={(id) => onChange({ mapMediaId: id })}
          label="Спрайт на карте дела"
          hint="Маленькая PNG-иконка для карты. Прозрачность приветствуется."
          aspect="square"
        />
      </div>

      <div className="pt-5 border-t border-ink-text/20 flex flex-col gap-5">
        <div className="type text-[11px] uppercase tracking-[0.28em] text-blood">
          Как открывается
        </div>

        <Field label="Режим" variant="paper">
          <Select
            value={value.discoveryMode}
            onChange={(v) =>
              onChange({
                discoveryMode: v as DiscoveryMode,
                discoveryTargetId: null,
              })
            }
            options={DISCOVERY_OPTIONS}
            variant="paper"
          />
        </Field>

        {hasTarget && (
          <Field label={targetLabel} required variant="paper">
            <Select
              value={value.discoveryTargetId ?? ''}
              onChange={(v) => onChange({ discoveryTargetId: v || null })}
              options={[
                { value: '', label: '— выберите цель —' },
                ...targetOptions,
              ]}
              variant="paper"
            />
          </Field>
        )}

        {value.discoveryMode !== 'ALWAYS' && (
          <Field
            label="Подсказка игроку"
            hint="Показывается в момент открытия: «Вы узнали адрес садика»"
            variant="paper"
          >
            <input
              value={value.discoveryHint}
              onChange={(e) => onChange({ discoveryHint: e.target.value })}
              maxLength={500}
              placeholder="Вы узнали адрес детского сада"
              className={INPUT_PAPER}
            />
          </Field>
        )}
      </div>
    </>
  );
}