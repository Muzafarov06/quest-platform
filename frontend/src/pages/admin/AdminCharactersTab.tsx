import { useEffect, useMemo, useState } from 'react';
import {
  adminListCharacters,
  adminCreateCharacter,
  adminUpdateCharacter,
  adminDeleteCharacter,
} from '../../api/characters';
import { adminListLocations } from '../../api/locations';
import {
  CharacterModal,
  type CharacterModalSaveData,
} from '../../components/admin/character/CharacterModal';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import type { CharacterAdmin } from '../../types/character';
import type { Location } from '../../types/location';
import type { ApiErrorResponse } from '../../types/api';

interface Props {
  caseId: string;
}

type CharacterModalState = 'new' | { id: string } | null;

export function AdminCharactersTab({ caseId }: Props) {
  const [characters, setCharacters] = useState<CharacterAdmin[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [charModal, setCharModal] = useState<CharacterModalState>(null);

  const reload = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const [chars, locs] = await Promise.all([
        adminListCharacters(caseId),
        adminListLocations(caseId),
      ]);
      setCharacters(chars);
      setLocations(locs);
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось загрузить персонажей.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const editingCharacter = useMemo(() => {
    if (!charModal || charModal === 'new') return null;
    return characters.find((c) => c.id === charModal.id) ?? null;
  }, [charModal, characters]);

  const handleSaveCharacter = async (data: CharacterModalSaveData) => {
    const common = {
      name: data.name,
      description: data.description || undefined,
      biography: data.biography || undefined,
      locationId: data.locationId,
      portraitMediaId: data.portraitMediaId,
      dialogueMediaId: data.dialogueMediaId,
      sortOrder: data.sortOrder,
      unlockMode: data.unlockMode,
      unlockTargetId: data.unlockTargetId,
    };
    if (charModal === 'new') {
      await adminCreateCharacter(caseId, common);
    } else if (charModal) {
      await adminUpdateCharacter(charModal.id, common);
    }
    setCharModal(null);
    await reload(true);
  };

  const handleCloseModal = () => {
    setCharModal(null);
    void reload(true);
  };

  const handleDeleteCharacter = async (c: CharacterAdmin) => {
    if (!confirm(`Удалить персонажа "${c.name}" и все его диалоги?`)) return;
    try {
      await adminDeleteCharacter(c.id);
      await reload(true);
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      alert(apiError.response?.data?.message ?? 'Не удалось удалить.');
    }
  };

  const locationName = (id: string | null) =>
    id ? locations.find((l) => l.id === id)?.name ?? '—' : '—';

  if (isLoading) {
    return (
      <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted py-8">
        Загружаем персонажей…
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
            Персонажи дела
          </div>
          <div className="font-poster text-2xl text-bone">
            {characters.length} шт.
          </div>
        </div>

        <button
          onClick={() => setCharModal('new')}
          className="inline-flex items-center gap-2
                     bg-blood text-paper px-5 py-3
                     type text-[12px] uppercase tracking-[0.24em]
                     hover:bg-blood-hover transition-colors cursor-pointer"
        >
          + Добавить персонажа
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="border border-bone/20 p-8 max-w-2xl">
          <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted mb-2">
            Пока пусто
          </div>
          <div className="text-bone">Добавьте первого персонажа.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {characters.map((c) => (
            <CharacterTile
              key={c.id}
              character={c}
              locationName={locationName(c.locationId)}
              onOpen={() => setCharModal({ id: c.id })}
              onEdit={() => setCharModal({ id: c.id })}
              onDelete={() => handleDeleteCharacter(c)}
            />
          ))}
        </div>
      )}

      {charModal && (
        <CharacterModal
          caseId={caseId}
          initial={editingCharacter}
          onSave={handleSaveCharacter}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

function CharacterTile({
  character: c,
  locationName,
  onOpen,
  onEdit,
  onDelete,
}: {
  character: CharacterAdmin;
  locationName: string;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="group relative border border-brass/25 bg-ink/60 backdrop-blur-sm
                 transition-colors hover:border-brass/60 cursor-pointer overflow-hidden"
      onClick={onOpen}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-ink-card">
        <CharPortrait mediaId={c.dialogueMediaId ?? c.portraitMediaId} alt={c.name} />

        <div
          className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(10,9,7,0.95) 0%, rgba(10,9,7,0.75) 40%, transparent 100%)',
          }}
        />

        <div className="absolute inset-x-0 bottom-0 p-3">
          <div
            className="font-poster text-lg leading-tight text-bone line-clamp-2"
            style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95)' }}
          >
            {c.name}
          </div>
        </div>

        <div
          className="absolute top-2 right-2 flex items-center gap-1.5
                     opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            title="Изменить"
            className="w-8 h-8 flex items-center justify-center
                       bg-ink/85 border border-brass/40 text-brass
                       type text-[12px]
                       hover:bg-brass/20 transition-colors cursor-pointer"
          >
            ✎
          </button>
          <button
            onClick={onDelete}
            title="Удалить"
            className="w-8 h-8 flex items-center justify-center
                       bg-ink/85 border border-blood/40 text-blood
                       type text-[12px]
                       hover:bg-blood/20 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {c.dialogs.length > 0 && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5
                       bg-ink/85 border border-brass/40 text-brass
                       type text-[10px] uppercase tracking-[0.2em]"
          >
            💬 {c.dialogs.length}
          </div>
        )}
      </div>

      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <span className="type text-[10px] uppercase tracking-[0.22em] text-bone-muted truncate">
          📍 {locationName}
        </span>
        <span className="type text-[10px] uppercase tracking-[0.22em]
                         text-brass group-hover:text-brass-hover
                         transition-colors shrink-0">
          Открыть →
        </span>
      </div>
    </div>
  );
}

function CharPortrait({
  mediaId,
  alt,
}: {
  mediaId: string | null;
  alt: string;
}) {
  const url = useMediaUrl(mediaId);

  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        draggable={false}
        className="w-full h-full object-cover object-top select-none"
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-ink-card">
      <img
        src="/images/logo.png"
        alt=""
        draggable={false}
        className="w-1/2 max-w-[120px] object-contain select-none
                   pointer-events-none opacity-40"
      />
    </div>
  );
}