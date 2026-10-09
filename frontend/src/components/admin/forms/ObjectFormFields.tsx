import { Field } from '../../ui/Field';
import { INPUT_PAPER } from '../../ui/inputStyles';
import { Select, type SelectOption } from '../../ui/Select';
import { Checkbox } from '../../ui/Checkbox';
import { MediaUploader } from '../MediaUploader';
import { NumberInput } from '../../ui/NumberInput';
import type {
  GameObjectType,
  GameObjectState,
  GameObjectRenderLayer,
} from '../../../types/object';

const OBJECT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'TELEPHONE', label: '📱 Телефон' },
  { value: 'INTERROGATION_PHONE', label: '☎️ Телефон для вызова на допрос' },
  { value: 'COMPUTER', label: '💻 Компьютер' },
  { value: 'DOOR', label: '🚪 Дверь' },
  { value: 'SAFE', label: '🔒 Сейф' },
  { value: 'CONTAINER', label: '📦 Контейнер' },
  { value: 'DOCUMENT', label: '📄 Документ' },
  { value: 'ITEM', label: '🔍 Предмет' },
  { value: 'OTHER', label: '❓ Другое' },
];

const OBJECT_STATE_OPTIONS: SelectOption[] = [
  { value: 'CLOSED', label: 'Закрыт' },
  { value: 'OPEN', label: 'Открыт' },
  { value: 'LOCKED', label: 'Заперт' },
  { value: 'BROKEN', label: 'Сломан' },
];

const RENDER_LAYER_OPTIONS: SelectOption[] = [
  { value: '-1', label: '⤓ Под остальными (фон: двери, лестницы)' },
  { value: '0',  label: '↕ По вертикали (обычный порядок)' },
  { value: '1',  label: '⤒ Поверх всего (мел, улики, документы)' },
];

export interface ObjectFormValue {
  name: string;
  description: string;
  objectType: GameObjectType;
  state: GameObjectState;
  mediaId: string | null;
  sortOrder: number;
  renderLayer: GameObjectRenderLayer;
  walkable: boolean;
}

interface Props {
  caseId: string;
  value: ObjectFormValue;
  onChange: (patch: Partial<ObjectFormValue>) => void;
  hideSortOrder?: boolean;
}

export function ObjectFormFields({
  caseId,
  value,
  onChange,
  hideSortOrder = false,
}: Props) {
  return (
    <>
      <Field label="Название" required variant="paper">
        <input
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          required
          maxLength={200}
          placeholder="Журнал диспетчера"
          className={INPUT_PAPER}
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="Тип"
          hint={
            value.objectType === 'INTERROGATION_PHONE'
              ? 'По клику игроку откроется список персонажей для допроса'
              : undefined
          }
          variant="paper"
        >
          <Select
            value={value.objectType}
            onChange={(v) => onChange({ objectType: v as GameObjectType })}
            options={OBJECT_TYPE_OPTIONS}
            variant="paper"
          />
        </Field>

        <Field label="Состояние" variant="paper">
          <Select
            value={value.state}
            onChange={(v) => onChange({ state: v as GameObjectState })}
            options={OBJECT_STATE_OPTIONS}
            variant="paper"
          />
        </Field>
      </div>

      <Field label="Описание" variant="paper">
        <textarea
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Что видит игрок, кликнув на объект"
          rows={3}
          className={INPUT_PAPER + ' resize-none'}
        />
      </Field>

      {!hideSortOrder && (
        <Field label="Порядок сортировки" variant="paper">
          <NumberInput
            value={value.sortOrder}
            onChange={(v) => onChange({ sortOrder: v === '' ? 0 : v })}
            min={0}
            className={INPUT_PAPER}
            variant="paper"
          />
        </Field>
      )}

      <div className="pt-5 border-t border-ink-text/20 flex flex-col gap-5">
        <div className="type text-[11px] uppercase tracking-[0.28em] text-blood">
          Отрисовка и физика
        </div>

        <Field
          label="Слой"
          hint="Определяет, как объект перекрывает другие."
          variant="paper"
        >
          <Select
            value={String(value.renderLayer)}
            onChange={(v) =>
              onChange({ renderLayer: Number(v) as GameObjectRenderLayer })
            }
            options={RENDER_LAYER_OPTIONS}
            variant="paper"
          />
        </Field>

        <Field
          label="Проходимость"
          hint="Если включено — игрок проходит сквозь объект (мел, рисунок на стене)."
          variant="paper"
        >
          <div className="pt-1">
            <Checkbox
              checked={value.walkable}
              onChange={(checked) => onChange({ walkable: checked })}
              label="По объекту можно ходить"
            />
          </div>
        </Field>
      </div>

      <div className="pt-4 border-t border-ink-text/20">
        <MediaUploader
          caseId={caseId}
          value={value.mediaId}
          onChange={(id) => onChange({ mediaId: id })}
          label="Спрайт объекта"
          hint="PNG с прозрачностью. Не обязательно."
          aspect="square"
        />
      </div>
    </>
  );
}