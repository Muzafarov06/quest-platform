import { useEffect, useState, type FormEvent } from 'react';
import {
  adminListConditions,
  adminCreateCondition,
  adminUpdateCondition,
  adminDeleteCondition,
  adminCreateEvent,
  adminUpdateEvent,
  adminDeleteEvent,
  type ConditionType,
  type ConditionWithEvents,
  type CreateGameEventRequest,
} from '../../api/events';
import { adminListLocations } from '../../api/locations';
import { adminListEvidences } from '../../api/evidences';
import { adminListObjects } from '../../api/objects';
import { Checkbox } from '../../components/ui/Checkbox';
import { NumberInput } from '../../components/ui/NumberInput';
import { Select, type SelectOption } from '../../components/ui/Select';
import { INPUT_DARK } from '../../components/ui/inputStyles';
import type { Location } from '../../types/location';
import type { Evidence } from '../../types/evidence';
import type { GameObject } from '../../types/object';
import type { GameEvent, EventType } from '../../types/action';
import type { ApiErrorResponse } from '../../types/api';

/* ============================================================
   Справочники
   ============================================================ */

const CONDITION_TYPES: ConditionType[] = [
  'OBJECT_INTERACTED', 'LOCATION_VISITED', 'EVIDENCE_DISCOVERED', 'PUZZLE_SOLVED',
];

const CONDITION_ICON: Record<ConditionType, string> = {
  OBJECT_INTERACTED: '🔍',
  LOCATION_VISITED: '🚶',
  EVIDENCE_DISCOVERED: '📄',
  PUZZLE_SOLVED: '🧩',
};

const CONDITION_WHEN: Record<ConditionType, string> = {
  OBJECT_INTERACTED: 'Игрок взаимодействует с',
  LOCATION_VISITED: 'Игрок входит в',
  EVIDENCE_DISCOVERED: 'Игрок находит',
  PUZZLE_SOLVED: 'Игрок решает',
};

const CONDITION_TARGET_LABEL: Record<ConditionType, string> = {
  OBJECT_INTERACTED: 'объектом',
  LOCATION_VISITED: 'локацию',
  EVIDENCE_DISCOVERED: 'улику',
  PUZZLE_SOLVED: 'головоломку',
};

const EVENT_TYPES: EventType[] = [
  'SHOW_MESSAGE',
  'REVEAL_EVIDENCE',
  'UNLOCK_OBJECT',
  'UNLOCK_LOCATION',
  'DISPATCH_CALL',
];

const EVENT_ICON: Record<EventType, string> = {
  SHOW_MESSAGE: '💬',
  REVEAL_EVIDENCE: '📄',
  UNLOCK_OBJECT: '🔓',
  UNLOCK_LOCATION: '🚪',
  DISPATCH_CALL: '📞',
};

const EVENT_TITLE: Record<EventType, string> = {
  SHOW_MESSAGE: 'Показать сообщение',
  REVEAL_EVIDENCE: 'Раскрыть улику',
  UNLOCK_OBJECT: 'Разблокировать объект',
  UNLOCK_LOCATION: 'Разблокировать локацию',
  DISPATCH_CALL: 'Диспетчерский звонок',
};

const CONDITION_TYPE_OPTIONS: SelectOption[] = CONDITION_TYPES.map((t) => ({
  value: t,
  label: `${CONDITION_ICON[t]}  ${CONDITION_WHEN[t]} ${CONDITION_TARGET_LABEL[t]}`,
}));

const EVENT_TYPE_OPTIONS: SelectOption[] = EVENT_TYPES.map((t) => ({
  value: t,
  label: `${EVENT_ICON[t]}  ${EVENT_TITLE[t]}`,
}));

/* ============================================================
   Компонент
   ============================================================ */

interface Props {
  caseId: string;
}

interface ConditionFormState {
  conditionType: ConditionType;
  targetId: string;
}

interface EventFormState {
  eventType: EventType;
  targetId: string;
  message: string;
  once: boolean;
  sortOrder: number;
}

const emptyConditionForm: ConditionFormState = {
  conditionType: 'OBJECT_INTERACTED',
  targetId: '',
};

const emptyEventForm: EventFormState = {
  eventType: 'SHOW_MESSAGE',
  targetId: '',
  message: '',
  once: true,
  sortOrder: 0,
};

export function AdminEventsTab({ caseId }: Props) {
  const [conditions, setConditions] = useState<ConditionWithEvents[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingConditionId, setEditingConditionId] = useState<string | 'new' | null>(null);
  const [condForm, setCondForm] = useState<ConditionFormState>(emptyConditionForm);
  const [condError, setCondError] = useState<string | null>(null);
  const [isSavingCond, setIsSavingCond] = useState(false);

  const [eventFormConditionId, setEventFormConditionId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<EventFormState>(emptyEventForm);
  const [eventError, setEventError] = useState<string | null>(null);
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  const reload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [conds, locs, evs] = await Promise.all([
        adminListConditions(caseId),
        adminListLocations(caseId),
        adminListEvidences(caseId),
      ]);
      setConditions(conds);
      setLocations(locs);
      setEvidences(evs);

      const objectsArrays = await Promise.all(
        locs.map((l) => adminListObjects(l.id).catch(() => []))
      );
      setObjects(objectsArrays.flat());
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось загрузить события.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  /* ---------- Условия ---------- */

  const startCreateCondition = () => {
    setCondForm(emptyConditionForm);
    setCondError(null);
    setEditingConditionId('new');
  };

  const startEditCondition = (c: ConditionWithEvents) => {
    setCondForm({
      conditionType: c.conditionType,
      targetId: c.targetId ?? '',
    });
    setCondError(null);
    setEditingConditionId(c.id);
  };

  const cancelCondition = () => {
    setEditingConditionId(null);
    setCondError(null);
  };

  const submitCondition = async (e: FormEvent) => {
    e.preventDefault();
    setCondError(null);
    setIsSavingCond(true);
    try {
      const data = {
        conditionType: condForm.conditionType,
        targetId: condForm.targetId || null,
      };
      if (editingConditionId === 'new') {
        await adminCreateCondition(caseId, data);
      } else if (editingConditionId) {
        await adminUpdateCondition(editingConditionId, data);
      }
      await reload();
      setEditingConditionId(null);
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setCondError(apiError.response?.data?.message ?? 'Не удалось сохранить условие.');
    } finally {
      setIsSavingCond(false);
    }
  };

  const deleteCondition = async (c: ConditionWithEvents) => {
    if (!confirm(`Удалить правило и ${c.events.length} реакций?`)) return;
    try {
      await adminDeleteCondition(c.id);
      await reload();
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      alert(apiError.response?.data?.message ?? 'Не удалось удалить.');
    }
  };

  /* ---------- События ---------- */

  const startCreateEvent = (conditionId: string) => {
    setEventForm(emptyEventForm);
    setEventError(null);
    setEventFormConditionId(conditionId);
    setEditingEventId(null);
  };

  const startEditEvent = (conditionId: string, e: GameEvent) => {
    setEventForm({
      eventType: e.eventType,
      targetId: e.targetId ?? '',
      message: e.message ?? '',
      once: e.once,
      sortOrder: e.sortOrder,
    });
    setEventError(null);
    setEventFormConditionId(conditionId);
    setEditingEventId(e.id);
  };

  const cancelEvent = () => {
    setEventFormConditionId(null);
    setEditingEventId(null);
    setEventError(null);
  };

  const submitEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventFormConditionId) return;
    setEventError(null);
    setIsSavingEvent(true);
    try {
      const data: CreateGameEventRequest = {
        eventType: eventForm.eventType,
        targetId: eventForm.targetId || null,
        message: eventForm.message.trim() || undefined,
        once: eventForm.once,
        sortOrder: eventForm.sortOrder,
      };
      if (editingEventId) {
        await adminUpdateEvent(editingEventId, {
          eventType: eventForm.eventType,
          targetId: eventForm.targetId || null,
          message: eventForm.message.trim() || undefined,
          once: eventForm.once,
          sortOrder: eventForm.sortOrder,
        });
      } else {
        await adminCreateEvent(eventFormConditionId, data);
      }
      await reload();
      cancelEvent();
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setEventError(apiError.response?.data?.message ?? 'Не удалось сохранить реакцию.');
    } finally {
      setIsSavingEvent(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Удалить реакцию?')) return;
    try {
      await adminDeleteEvent(eventId);
      await reload();
    } catch {
      alert('Не удалось удалить реакцию');
    }
  };

  /* ---------- Справочники ---------- */

  const targetName = (targetId: string | null): string => {
    if (!targetId) return '—';
    return locations.find((l) => l.id === targetId)?.name
        ?? evidences.find((e) => e.id === targetId)?.title
        ?? objects.find((o) => o.id === targetId)?.name
        ?? targetId.slice(0, 8);
  };

  /* Options для селекта цели условия */
  const conditionTargetOptions: SelectOption[] = (() => {
    if (condForm.conditionType === 'LOCATION_VISITED') {
      return locations.map((l) => ({ value: l.id, label: l.name }));
    }
    if (condForm.conditionType === 'OBJECT_INTERACTED') {
      return objects.map((o) => ({ value: o.id, label: o.name }));
    }
    if (condForm.conditionType === 'EVIDENCE_DISCOVERED') {
      return evidences.map((e) => ({ value: e.id, label: e.title }));
    }
    return [];
  })();

  /* Options для селекта цели события */
  const eventTargetOptions: SelectOption[] = (() => {
    if (eventForm.eventType === 'REVEAL_EVIDENCE') {
      return evidences.map((e) => ({ value: e.id, label: e.title }));
    }
    if (eventForm.eventType === 'UNLOCK_OBJECT') {
      return objects.map((o) => ({ value: o.id, label: o.name }));
    }
    if (eventForm.eventType === 'UNLOCK_LOCATION') {
      return locations.map((l) => ({ value: l.id, label: l.name }));
    }
    return [];
  })();

  /* ---------- Render ---------- */

  if (isLoading) {
    return (
      <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted py-8">
        Загружаем правила…
      </div>
    );
  }
  if (error) {
    return (
      <div className="border border-blood/40 bg-blood/10 p-5 max-w-2xl">
        <div className="type text-[12px] uppercase tracking-[0.28em] text-blood mb-2">
          Ошибка
        </div>
        <div className="text-bone text-base">{error}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Шапка */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="type text-[11px] uppercase tracking-[0.28em] text-bone-muted mb-1">
            Правила · КОГДА → ТОГДА
          </div>
          <div className="font-poster text-2xl text-bone">
            {conditions.length} правил
          </div>
        </div>

        {editingConditionId === null && (
          <button
            onClick={startCreateCondition}
            className="inline-flex items-center gap-2
                       bg-blood text-paper px-5 py-3
                       type text-[12px] uppercase tracking-[0.24em]
                       hover:bg-blood-hover transition-colors cursor-pointer"
          >
            + Добавить правило
          </button>
        )}
      </div>

      {/* Форма условия */}
      {editingConditionId !== null && (
        <div className="relative max-w-3xl mb-8">
          <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />

          <form
            onSubmit={submitCondition}
            className="paper paper-old p-6 md:p-8 relative flex flex-col gap-6"
          >
            <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
              <span className="stamp-red text-xs">
                {editingConditionId === 'new' ? 'Новое' : 'Правка'}
              </span>
            </div>

            <div className="flex items-baseline justify-between pb-3 border-b border-ink-text/20">
              <span className="type text-[11px] uppercase tracking-[0.28em] text-ink-text-soft">
                Что должно произойти
              </span>
            </div>

            <label className="flex flex-col gap-2">
              <span className="type text-[11px] uppercase tracking-[0.24em] text-ink-text-dim">
                Событие-триггер
              </span>
              <Select
                value={condForm.conditionType}
                onChange={(v) =>
                  setCondForm({
                    conditionType: v as ConditionType,
                    targetId: '',
                  })
                }
                options={CONDITION_TYPE_OPTIONS}
                variant="paper"
              />
            </label>

            {condForm.conditionType !== 'PUZZLE_SOLVED' && (
              <label className="flex flex-col gap-2">
                <span className="type text-[11px] uppercase tracking-[0.24em] text-ink-text-dim">
                  {CONDITION_TARGET_LABEL[condForm.conditionType]}
                </span>
                <Select
                  value={condForm.targetId}
                  onChange={(v) => setCondForm({ ...condForm, targetId: v })}
                  options={[
                    { value: '', label: '— выберите —' },
                    ...conditionTargetOptions,
                  ]}
                  variant="paper"
                />
              </label>
            )}

            {condForm.conditionType === 'PUZZLE_SOLVED' && (
              <p className="type text-[12px] text-ink-text-dim italic">
                Сущности «головоломка» пока нет — правило создастся без цели.
              </p>
            )}

            {condError && (
              <div className="px-4 py-3 bg-blood/15 border-l-4 border-blood type text-[13px] text-blood">
                {condError}
              </div>
            )}

            <div className="flex gap-3 pt-2 flex-wrap">
              <button
                type="submit"
                disabled={isSavingCond}
                className="bg-blood text-paper px-6 py-3
                           type text-[13px] uppercase tracking-[0.26em]
                           hover:bg-blood-hover transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSavingCond ? 'Сохраняем…' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={cancelCondition}
                className="px-6 py-3 border border-ink-text/40 text-ink-text
                           type text-[13px] uppercase tracking-[0.26em]
                           hover:border-ink-text/70 hover:bg-black/5
                           transition-colors cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список правил */}
      {conditions.length === 0 ? (
        <div className="border border-bone/20 p-8 max-w-2xl">
          <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted mb-2">
            Пока пусто
          </div>
          <div className="text-bone">
            Добавьте первое правило — КОГДА что-то происходит, ТОГДА что-то случается.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {conditions.map((c) => (
            <ConditionCard
              key={c.id}
              condition={c}
              targetName={targetName}
              onEditCondition={() => startEditCondition(c)}
              onDeleteCondition={() => deleteCondition(c)}
              onCreateEvent={() => startCreateEvent(c.id)}
              onEditEvent={(ev) => startEditEvent(c.id, ev)}
              onDeleteEvent={deleteEvent}
              eventFormConditionId={eventFormConditionId}
              eventForm={eventForm}
              setEventForm={setEventForm}
              eventError={eventError}
              isSavingEvent={isSavingEvent}
              submitEvent={submitEvent}
              cancelEvent={cancelEvent}
              editingEventId={editingEventId}
              eventTargetOptions={eventTargetOptions}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Карточка правила
   ============================================================ */

interface CardProps {
  condition: ConditionWithEvents;
  targetName: (id: string | null) => string;
  onEditCondition: () => void;
  onDeleteCondition: () => void;
  onCreateEvent: () => void;
  onEditEvent: (e: GameEvent) => void;
  onDeleteEvent: (id: string) => void;
  eventFormConditionId: string | null;
  eventForm: EventFormState;
  setEventForm: (v: EventFormState) => void;
  eventError: string | null;
  isSavingEvent: boolean;
  submitEvent: (e: FormEvent) => void;
  cancelEvent: () => void;
  editingEventId: string | null;
  eventTargetOptions: SelectOption[];
}

function ConditionCard({
  condition: c,
  targetName,
  onEditCondition,
  onDeleteCondition,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
  eventFormConditionId,
  eventForm,
  setEventForm,
  eventError,
  isSavingEvent,
  submitEvent,
  cancelEvent,
  editingEventId,
  eventTargetOptions,
}: CardProps) {
  const isFormOpen = eventFormConditionId === c.id;
  const targetId = c.targetId;
  const target = targetName(targetId);

  return (
    <div className="border border-brass/30 bg-ink/60 backdrop-blur-sm overflow-hidden">
      {/* Шапка правила */}
      <div className="flex items-stretch">
        <div className="w-20 shrink-0 flex items-center justify-center
                        bg-brass/10 border-r border-brass/25
                        text-4xl">
          {CONDITION_ICON[c.conditionType]}
        </div>

        <div className="flex-1 p-4 min-w-0">
          <div className="type text-[10px] uppercase tracking-[0.3em] text-brass mb-1">
            Когда
          </div>
          <div className="font-poster text-lg md:text-xl text-bone leading-tight">
            {CONDITION_WHEN[c.conditionType]}{' '}
            <span className="text-brass">{target}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 shrink-0">
          <button
            onClick={onEditCondition}
            className="px-3 py-1.5 border border-bone/25 text-bone-muted
                       type text-[11px] uppercase tracking-[0.2em]
                       hover:text-bone hover:border-bone/60
                       transition-colors cursor-pointer"
          >
            Изменить
          </button>
          <button
            onClick={onDeleteCondition}
            className="w-8 h-8 flex items-center justify-center
                       border border-blood/40 text-blood
                       type text-[14px]
                       hover:bg-blood/10 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Разделитель */}
      <div className="flex items-center gap-3 px-5 py-2
                      border-y border-brass/20 bg-ink/40">
        <span className="h-px flex-1 bg-brass/25" />
        <span className="type text-[10px] uppercase tracking-[0.3em] text-brass">
          Тогда
        </span>
        <span className="h-px flex-1 bg-brass/25" />
      </div>

      {/* Список реакций */}
      <div className="p-4 flex flex-col gap-2">
        {c.events.length === 0 && !isFormOpen && (
          <div className="type text-[12px] text-bone-muted italic px-2 py-3">
            Реакций нет. Правило «пустое» — ничего не произойдёт.
          </div>
        )}

        {c.events.map((e) => (
          <EventRow
            key={e.id}
            event={e}
            targetName={targetName}
            onEdit={() => onEditEvent(e)}
            onDelete={() => onDeleteEvent(e.id)}
          />
        ))}

        {isFormOpen ? (
          <form
            onSubmit={submitEvent}
            className="mt-2 p-4 border border-brass/30 bg-ink-card
                       flex flex-col gap-4"
          >
            <div className="type text-[10px] uppercase tracking-[0.3em] text-brass">
              {editingEventId ? 'Правка реакции' : 'Новая реакция'}
            </div>

            <label className="flex flex-col gap-2">
              <span className="type text-[10px] uppercase tracking-[0.24em] text-bone-muted">
                Что сделать
              </span>
              <Select
                value={eventForm.eventType}
                onChange={(v) =>
                  setEventForm({
                    ...eventForm,
                    eventType: v as EventType,
                    targetId: '',
                  })
                }
                options={EVENT_TYPE_OPTIONS}
                variant="dark"
              />
            </label>

            {eventForm.eventType !== 'SHOW_MESSAGE'
              && eventForm.eventType !== 'DISPATCH_CALL' && (
              <label className="flex flex-col gap-2">
                <span className="type text-[10px] uppercase tracking-[0.24em] text-bone-muted">
                  Цель
                </span>
                <Select
                  value={eventForm.targetId}
                  onChange={(v) =>
                    setEventForm({ ...eventForm, targetId: v })
                  }
                  options={[
                    { value: '', label: '— выберите —' },
                    ...eventTargetOptions,
                  ]}
                  variant="dark"
                />
              </label>
            )}

            {(eventForm.eventType === 'SHOW_MESSAGE'
              || eventForm.eventType === 'DISPATCH_CALL') && (
              <label className="flex flex-col gap-2">
                <span className="type text-[10px] uppercase tracking-[0.24em] text-bone-muted">
                  {eventForm.eventType === 'DISPATCH_CALL'
                    ? 'Текст звонка (можно начать с [Имя отправителя])'
                    : 'Текст сообщения'}
                </span>
                <textarea
                  value={eventForm.message}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, message: e.target.value })
                  }
                  rows={3}
                  required
                  className={INPUT_DARK + ' resize-none'}
                />
              </label>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="flex items-end pb-2">
                <Checkbox
                  checked={eventForm.once}
                  onChange={(checked) =>
                    setEventForm({ ...eventForm, once: checked })
                  }
                  label="Срабатывает один раз"
                />
              </div>

              <label className="flex flex-col gap-2">
                <span className="type text-[10px] uppercase tracking-[0.24em] text-bone-muted">
                  Порядок
                </span>
                <NumberInput
                  value={eventForm.sortOrder}
                  onChange={(v) =>
                    setEventForm({ ...eventForm, sortOrder: v === '' ? 0 : v })
                  }
                  min={0}
                  className={INPUT_DARK}
                  variant="dark"
                />
              </label>
            </div>

            {eventError && (
              <div className="px-3 py-2 bg-blood/15 border-l-4 border-blood
                              type text-[12px] text-blood">
                {eventError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSavingEvent}
                className="bg-blood text-paper px-4 py-2
                           type text-[11px] uppercase tracking-[0.24em]
                           hover:bg-blood-hover transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSavingEvent ? 'Сохраняем…' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={cancelEvent}
                className="px-4 py-2 border border-bone/25 text-bone-muted
                           type text-[11px] uppercase tracking-[0.24em]
                           hover:text-bone hover:border-bone/60
                           transition-colors cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={onCreateEvent}
            className="self-start mt-1 px-4 py-2 border border-brass/40 text-brass
                       type text-[11px] uppercase tracking-[0.24em]
                       hover:bg-brass/10 transition-colors cursor-pointer"
          >
            + Добавить реакцию
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Строка реакции
   ============================================================ */

function EventRow({
  event,
  targetName,
  onEdit,
  onDelete,
}: {
  event: GameEvent;
  targetName: (id: string | null) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasTarget =
    event.eventType !== 'SHOW_MESSAGE'
    && event.eventType !== 'DISPATCH_CALL'
    && event.targetId;

  const target = hasTarget ? targetName(event.targetId) : null;

  return (
    <div className="flex items-stretch gap-3
                    border border-brass/20 bg-ink-card
                    hover:border-brass/40 transition-colors">
      <div className="w-14 shrink-0 flex items-center justify-center
                      bg-brass/5 border-r border-brass/20 text-2xl">
        {EVENT_ICON[event.eventType]}
      </div>

      <div className="flex-1 py-3 min-w-0">
        <div className="type text-[10px] uppercase tracking-[0.3em] text-brass mb-0.5">
          {EVENT_TITLE[event.eventType]}
        </div>

        {target && (
          <div className="font-poster text-base text-bone leading-tight truncate">
            → {target}
          </div>
        )}

        {(event.eventType === 'SHOW_MESSAGE'
          || event.eventType === 'DISPATCH_CALL') && event.message && (
          <div className="text-bone text-[14px] italic line-clamp-2">
            «{event.message}»
          </div>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          {event.once && (
            <span className="type text-[9px] uppercase tracking-[0.24em]
                             bg-brass/15 text-brass border border-brass/40
                             px-2 py-0.5">
              один раз
            </span>
          )}
          <span className="type text-[9px] uppercase tracking-[0.22em] text-bone-dim">
            порядок {event.sortOrder}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 pr-3 shrink-0">
        <button
          onClick={onEdit}
          className="px-2.5 py-1 border border-bone/25 text-bone-muted
                     type text-[10px] uppercase tracking-[0.2em]
                     hover:text-bone hover:border-bone/60
                     transition-colors cursor-pointer"
        >
          Изменить
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center
                     border border-blood/40 text-blood
                     type text-[12px]
                     hover:bg-blood/10 transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}