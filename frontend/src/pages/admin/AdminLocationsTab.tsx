import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  adminListLocations,
  adminCreateLocation,
  adminUpdateLocation,
  adminDeleteLocation,
  adminGetLocationDeleteInfo,
  type LocationDeleteInfo,
} from '../../api/locations';
import {
  adminListConnections,
  adminCreateConnection,
  adminDeleteConnection,
} from '../../api/connections';
import { adminListEvidences } from '../../api/evidences';
import { adminListCharacters } from '../../api/characters';
import { AdminObjectsSection } from '../../components/admin/AdminObjectsSection';
import {
  LocationFormFields,
  type LocationFormValue,
} from '../../components/admin/forms/LocationFormFields';
import { Select, type SelectOption } from '../../components/ui/Select';
import { INPUT_DARK } from '../../components/ui/inputStyles';
import { DeleteLocationModal } from '../../components/admin/map/DeleteLocationModal';
import type { Location } from '../../types/location';
import type { LocationConnection } from '../../types/connection';
import type { Evidence } from '../../types/evidence';
import type { CharacterAdmin } from '../../types/character';
import type { ApiErrorResponse } from '../../types/api';

interface Props {
  caseId: string;
}

const emptyForm: LocationFormValue = {
  name: '',
  description: '',
  locationType: 'ROOM',
  parentId: null,
  mediaId: null,
  previewMediaId: null,
  mapMediaId: null,
  sortOrder: 0,
  discoveryMode: 'ALWAYS',
  discoveryTargetId: null,
  discoveryHint: '',
};

export function AdminLocationsTab({ caseId }: Props) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [characters, setCharacters] = useState<CharacterAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<LocationFormValue>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [connectionsFor, setConnectionsFor] = useState<string | null>(null);
  const [connections, setConnections] = useState<LocationConnection[]>([]);
  const [newTarget, setNewTarget] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [objectsFor, setObjectsFor] = useState<string | null>(null);

  /* Удаление локации */
  const [deleteTarget, setDeleteTarget] = useState<LocationDeleteInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const reload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [locList, evList, charList] = await Promise.all([
        adminListLocations(caseId),
        adminListEvidences(caseId),
        adminListCharacters(caseId).catch(() => [] as CharacterAdmin[]),
      ]);
      setLocations(locList);
      setEvidences(evList);
      setCharacters(charList);
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось загрузить локации.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const sortedLocations = useMemo(
    () =>
      [...locations].sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ru')
      ),
    [locations]
  );

  /* ───────── Создание / редактирование ───────── */

  const startCreate = () => {
    setForm(emptyForm);
    setFormError(null);
    setEditingId('new');
  };

  const startEdit = (loc: Location) => {
    setForm({
      name: loc.name,
      description: loc.description ?? '',
      locationType: loc.locationType,
      parentId: loc.parentId,
      mediaId: loc.mediaId,
      previewMediaId: loc.previewMediaId,
      mapMediaId: loc.mapMediaId,
      sortOrder: loc.sortOrder,
      discoveryMode: loc.discoveryMode,
      discoveryTargetId: loc.discoveryTargetId,
      discoveryHint: loc.discoveryHint ?? '',
    });
    setFormError(null);
    setEditingId(loc.id);
  };

  const cancel = () => {
    setEditingId(null);
    setFormError(null);
  };

  const handleSubmit = async () => {
    setFormError(null);
    setIsSaving(true);
    try {
      const common = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        locationType: form.locationType,
        parentId: form.parentId,
        mediaId: form.mediaId,
        previewMediaId: form.previewMediaId,
        mapMediaId: form.mapMediaId,
        discoveryMode: form.discoveryMode,
        discoveryTargetId:
          form.discoveryMode === 'ALWAYS' || form.discoveryMode === 'ON_MANUAL'
            ? null
            : form.discoveryTargetId,
        discoveryHint: form.discoveryHint.trim() || undefined,
      };

      if (editingId === 'new') {
        await adminCreateLocation(caseId, { ...common, sortOrder: form.sortOrder });
      } else if (editingId) {
        await adminUpdateLocation(editingId, { ...common, sortOrder: form.sortOrder });
      }
      await reload();
      setEditingId(null);
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setFormError(apiError.response?.data?.message ?? 'Не удалось сохранить.');
    } finally {
      setIsSaving(false);
    }
  };

  /* ───────── Удаление ───────── */

  const handleDelete = async (loc: Location) => {
    try {
      const info = await adminGetLocationDeleteInfo(loc.id);
      setDeleteTarget(info);
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      alert(apiError.response?.data?.message ?? 'Не удалось получить данные');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminDeleteLocation(deleteTarget.locationId);
      if (connectionsFor === deleteTarget.locationId) setConnectionsFor(null);
      if (objectsFor === deleteTarget.locationId) setObjectsFor(null);
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      alert(apiError.response?.data?.message ?? 'Не удалось удалить.');
    } finally {
      setIsDeleting(false);
    }
  };

  /* ───────── Переходы ───────── */

  const openConnections = async (locId: string) => {
    if (connectionsFor === locId) {
      setConnectionsFor(null);
      return;
    }
    setConnectionsFor(locId);
    setConnectionError(null);
    setNewTarget('');
    setNewLabel('');
    try {
      const list = await adminListConnections(locId);
      setConnections(list);
    } catch {
      setConnections([]);
    }
  };

  const handleAddConnection = async () => {
    if (!connectionsFor || !newTarget) return;
    setConnectionError(null);
    try {
      await adminCreateConnection(connectionsFor, {
        toLocationId: newTarget,
        label: newLabel.trim() || undefined,
      });
      const list = await adminListConnections(connectionsFor);
      setConnections(list);
      setNewTarget('');
      setNewLabel('');
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setConnectionError(apiError.response?.data?.message ?? 'Не удалось создать переход.');
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!connectionsFor) return;
    try {
      await adminDeleteConnection(id);
      const list = await adminListConnections(connectionsFor);
      setConnections(list);
    } catch {
      alert('Не удалось удалить переход');
    }
  };

  const openObjects = (locId: string) => {
    setObjectsFor(objectsFor === locId ? null : locId);
  };

  const discoveryLabel = (mode: string): string => {
    switch (mode) {
      case 'ALWAYS': return 'открыта сразу';
      case 'ON_EVIDENCE': return 'после улики';
      case 'ON_LOCATION': return 'после локации';
      case 'ON_DIALOG': return 'после диалога';
      case 'ON_MANUAL': return 'вручную';
      default: return mode;
    }
  };

  /* ───────── Render ───────── */

  if (isLoading) {
    return (
      <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted py-8">
        Загружаем локации…
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="type text-[11px] uppercase tracking-[0.28em] text-bone-muted mb-1">
            Локации дела
          </div>
          <div className="font-poster text-2xl text-bone">
            {locations.length} шт.
          </div>
        </div>

        {editingId === null && (
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/cases/${caseId}/map`}
              className="px-4 py-2.5 border border-brass/40 text-brass
                         type text-[11px] uppercase tracking-[0.22em]
                         hover:bg-brass/10 transition-colors"
            >
              🗺 Карта дела
            </Link>
            <button
              onClick={startCreate}
              className="inline-flex items-center gap-2
                         bg-blood text-paper px-5 py-3
                         type text-[12px] uppercase tracking-[0.24em]
                         hover:bg-blood-hover transition-colors cursor-pointer"
            >
              + Добавить локацию
            </button>
          </div>
        )}
      </div>

      {editingId !== null && (
        <InlineLocationForm
          caseId={caseId}
          form={form}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          locations={locations}
          evidences={evidences.map((e) => ({ id: e.id, label: e.title }))}
          characters={characters.map((c) => ({ id: c.id, label: c.name }))}
          excludeLocationId={editingId === 'new' ? undefined : editingId}
          stamp={editingId === 'new' ? 'Новая' : 'Правка'}
          isSaving={isSaving}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={cancel}
        />
      )}

      {locations.length === 0 ? (
        <div className="border border-bone/20 p-8 max-w-2xl">
          <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted mb-2">
            Пока пусто
          </div>
          <div className="text-bone">Добавьте первую локацию.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedLocations.map((l) => (
            <div
              key={l.id}
              className="border border-brass/25 bg-ink/60 backdrop-blur-sm"
            >
              <div className="p-4 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="font-poster text-lg md:text-xl text-bone leading-tight">
                      {l.name}
                    </span>
                    <span className="type text-[11px] uppercase tracking-[0.22em] text-brass">
                      {l.locationType}
                    </span>
                    {l.parentId && (
                      <span className="type text-[10px] uppercase tracking-[0.22em] text-bone-dim">
                        · вложенная
                      </span>
                    )}
                  </div>
                  <div className="type text-[11px] text-bone-muted mt-1">
                    вход {Math.round(l.entryX)}/{Math.round(l.entryY)} ·{' '}
                    {discoveryLabel(l.discoveryMode)}
                    {l.mediaId && ' · 🎬 сцена'}
                    {l.previewMediaId && ' · 🖼 превью'}
                    {l.mapMediaId && ' · 🗺 карта'}
                  </div>
                </div>

                <Link
                  to={`/admin/cases/${caseId}/scene/${l.id}`}
                  className="px-3 py-1.5 bg-brass/20 text-brass border border-brass/40
                             type text-[11px] uppercase tracking-[0.2em]
                             hover:bg-brass/30 transition-colors"
                >
                  🎨 Сцена
                </Link>

                <button
                  onClick={() => openObjects(l.id)}
                  className="px-3 py-1.5 border border-bone/25 text-bone-muted
                             type text-[11px] uppercase tracking-[0.2em]
                             hover:text-bone hover:border-bone/60 transition-colors cursor-pointer"
                >
                  {objectsFor === l.id ? '▲ Объекты' : '▼ Объекты'}
                </button>

                <button
                  onClick={() => openConnections(l.id)}
                  className="px-3 py-1.5 border border-bone/25 text-bone-muted
                             type text-[11px] uppercase tracking-[0.2em]
                             hover:text-bone hover:border-bone/60 transition-colors cursor-pointer"
                >
                  {connectionsFor === l.id ? '▲ Переходы' : '▼ Переходы'}
                </button>

                <button
                  onClick={() => startEdit(l)}
                  className="px-3 py-1.5 border border-bone/25 text-bone-muted
                             type text-[11px] uppercase tracking-[0.2em]
                             hover:text-bone hover:border-bone/60 transition-colors cursor-pointer"
                >
                  Изменить
                </button>

                <button
                  onClick={() => handleDelete(l)}
                  className="px-3 py-1.5 border border-blood/40 text-blood
                             type text-[11px] uppercase tracking-[0.2em]
                             hover:bg-blood/10 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {objectsFor === l.id && (
                <div className="border-t border-brass/25 p-4 bg-ink/40">
                  <AdminObjectsSection caseId={caseId} locationId={l.id} />
                </div>
              )}

              {connectionsFor === l.id && (
                <div className="border-t border-brass/25 p-4 bg-ink/40">
                  <div className="type text-[11px] uppercase tracking-[0.24em] text-brass mb-3">
                    Исходящие переходы ({connections.length})
                  </div>

                  {connections.length === 0 ? (
                    <p className="type text-[12px] text-bone-muted mb-3">
                      Переходов нет.
                    </p>
                  ) : (
                    <ul className="space-y-1 mb-3">
                      {connections.map((c) => {
                        const target = locations.find((x) => x.id === c.toLocationId);
                        return (
                          <li
                            key={c.id}
                            className="flex items-center gap-2
                                       bg-ink-card border border-brass/20 px-3 py-2"
                          >
                            <span className="flex-1 text-bone text-sm">
                              {c.label ?? 'Перейти'}{' '}
                              <span className="text-bone-dim">→</span>{' '}
                              <strong className="text-bone">
                                {target?.name ?? '???'}
                              </strong>
                            </span>
                            <button
                              onClick={() => handleDeleteConnection(c.id)}
                              className="text-blood hover:text-blood-hover text-sm cursor-pointer"
                            >
                              ✕
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <div className="flex flex-wrap gap-3 items-end">
                    <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
                      <span className="type text-[10px] uppercase tracking-[0.22em] text-bone-muted">
                        Куда
                      </span>
                      <Select
                        value={newTarget}
                        onChange={setNewTarget}
                        options={[
                          { value: '', label: '— выберите локацию —' },
                          ...locations
                            .filter((x) => x.id !== l.id)
                            .map((x) => ({
                              value: x.id,
                              label: x.name,
                            }) as SelectOption),
                        ]}
                        variant="dark"
                      />
                    </label>

                    <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
                      <span className="type text-[10px] uppercase tracking-[0.22em] text-bone-muted">
                        Метка
                      </span>
                      <input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        maxLength={200}
                        className={INPUT_DARK}
                      />
                    </label>

                    <button
                      onClick={handleAddConnection}
                      disabled={!newTarget}
                      className="px-4 py-2 bg-blood text-paper
                                 type text-[11px] uppercase tracking-[0.24em]
                                 hover:bg-blood-hover transition-colors
                                 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      + Добавить
                    </button>
                  </div>

                  {connectionError && (
                    <div className="mt-2 type text-[12px] text-blood">
                      {connectionError}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Модалка удаления */}
      {deleteTarget && (
        <DeleteLocationModal
          info={deleteTarget}
          onConfirm={confirmDelete}
          onClose={() => !isDeleting && setDeleteTarget(null)}
          busy={isDeleting}
        />
      )}
    </div>
  );
}

/* ============================================================ */

function InlineLocationForm({
  caseId,
  form,
  onChange,
  locations,
  evidences,
  characters,
  excludeLocationId,
  stamp,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: {
  caseId: string;
  form: LocationFormValue;
  onChange: (patch: Partial<LocationFormValue>) => void;
  locations: Location[];
  evidences: { id: string; label: string }[];
  characters: { id: string; label: string }[];
  excludeLocationId?: string;
  stamp: string;
  isSaving: boolean;
  error: string | null;
  onSubmit: () => void | Promise<void>;
  onCancel: () => void;
}) {
  return (
    <div className="relative max-w-3xl mb-8">
      <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isSaving) void onSubmit();
        }}
        className="paper paper-old p-6 md:p-8 relative flex flex-col gap-6"
      >
        <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
          <span className="stamp-red text-xs">{stamp}</span>
        </div>

        <div className="flex items-baseline justify-between pb-3 border-b border-ink-text/20">
          <span className="type text-[11px] uppercase tracking-[0.28em] text-ink-text-soft">
            Карточка локации
          </span>
        </div>

        <LocationFormFields
          caseId={caseId}
          value={form}
          onChange={onChange}
          locations={locations}
          evidences={evidences}
          characters={characters}
          excludeLocationId={excludeLocationId}
        />

        {error && (
          <div className="px-4 py-3 bg-blood/15 border-l-4 border-blood
                          type text-[13px] text-blood">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2 flex-wrap">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blood text-paper px-6 py-3
                       type text-[13px] uppercase tracking-[0.26em]
                       hover:bg-blood-hover transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? 'Сохраняем…' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={onCancel}
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
  );
}