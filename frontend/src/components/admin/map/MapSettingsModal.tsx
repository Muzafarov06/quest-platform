import { useState } from 'react';
import { MediaUploader } from '../MediaUploader';
import { NumberInput } from '../../ui/NumberInput';
import { Select, type SelectOption } from '../../ui/Select';
import type { Case } from '../../../types/case';
import type { Location } from '../../../types/location';

interface Props {
  caseData: Case;
  locations: Location[];
  onSave: (data: {
    mapMediaId: string | null;
    entryLocationId: string | null;
    mapWidth: number;
    mapHeight: number;
  }) => Promise<void>;
  onClose: () => void;
}

const INPUT_DARK =
  'w-full bg-ink-soft border border-ink-line text-bone px-3 py-2 ' +
  'placeholder:text-bone-dim/60 focus:outline-none focus:border-blood ' +
  'font-type text-[14px] transition-colors';

export function MapSettingsModal({
  caseData,
  locations,
  onSave,
  onClose,
}: Props) {
  const [mapMediaId, setMapMediaId] = useState<string | null>(caseData.mapMediaId);
  const [entryLocationId, setEntryLocationId] = useState<string | null>(
    caseData.entryLocationId
  );
  const [mapWidth, setMapWidth] = useState<number>(caseData.mapWidth);
  const [mapHeight, setMapHeight] = useState<number>(caseData.mapHeight);
  const [isSaving, setIsSaving] = useState(false);

  const entryOptions: SelectOption[] = [
    { value: '', label: '— не задана (старт «из штаба»)' },
    ...locations
      .filter((l) => !l.parentId)
      .map((l) => ({ value: l.id, label: l.name })),
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ mapMediaId, entryLocationId, mapWidth, mapHeight });
    } finally {
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
        className="relative w-full max-w-2xl border-2 border-brass/50 bg-ink/95 my-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(201,162,74,0.2), 0 24px 60px rgba(0,0,0,0.95)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center
                     text-bone-muted hover:text-blood type text-xl
                     transition-colors cursor-pointer z-10"
        >
          ✕
        </button>

        <div className="p-6 md:p-8 flex flex-col gap-6">
          <div className="type text-[11px] uppercase tracking-[0.32em] text-brass
                          pb-3 border-b border-brass/25">
            Настройки карты
          </div>

          <MediaUploader
            caseId={caseData.id}
            value={mapMediaId}
            onChange={setMapMediaId}
            label="Фон карты местности"
            hint="Схема города, леса, здания. Не обязательно."
            aspect="video"
          />

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className="type text-[10px] uppercase tracking-[0.24em]
                               text-bone-muted">
                Ширина (px)
              </span>
              <NumberInput
                value={mapWidth}
                onChange={(v) => setMapWidth(v === '' ? 2400 : v)}
                min={800}
                max={8000}
                step={100}
                className={INPUT_DARK}
                variant="dark"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="type text-[10px] uppercase tracking-[0.24em]
                               text-bone-muted">
                Высота (px)
              </span>
              <NumberInput
                value={mapHeight}
                onChange={(v) => setMapHeight(v === '' ? 1600 : v)}
                min={600}
                max={6000}
                step={100}
                className={INPUT_DARK}
                variant="dark"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="type text-[10px] uppercase tracking-[0.24em]
                             text-bone-muted">
              Стартовая локация
            </span>
            <Select
              value={entryLocationId ?? ''}
              onChange={(v) => setEntryLocationId(v || null)}
              options={entryOptions}
              variant="dark"
            />
            <span className="type text-[10px] text-bone-dim">
              Где появятся игроки при старте сессии.
            </span>
          </label>

          <div className="flex gap-3 pt-2 flex-wrap justify-end">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-3 border border-bone/25 text-bone-muted
                         type text-[12px] uppercase tracking-[0.24em]
                         hover:text-bone hover:border-bone/60
                         transition-colors cursor-pointer disabled:opacity-40"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blood text-paper px-6 py-3
                         type text-[12px] uppercase tracking-[0.24em]
                         hover:bg-blood-hover transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? 'Сохраняем…' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}