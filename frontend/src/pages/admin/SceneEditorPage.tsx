import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container } from '../../components/layout/Container';
import { MapPanContainer } from '../../components/admin/map/MapPanContainer';
import {
  ScenePin,
  type ScenePinData,
  type SceneTransform,
} from '../../components/admin/scene/ScenePin';
import {
  ObjectModal,
  type ObjectModalSaveData,
} from '../../components/admin/object/ObjectModal';
import {
  CharacterModal,
  type CharacterModalSaveData,
} from '../../components/admin/character/CharacterModal';
import {
  LocationModal,
  type LocationModalSaveData,
} from '../../components/admin/map/LocationModal';
import {
  EvidenceModal,
  type EvidenceModalSaveData,
} from '../../components/admin/evidence/EvidenceModal';
import { MediaUploader } from '../../components/admin/MediaUploader';
import {
  getScene,
  updateLocationEntry,
  updateConnectionPosition,
} from '../../api/scene';
import {
  adminCreateObject,
  adminUpdateObject,
  adminUpdateObjectTransform,
  adminDeleteObject,
} from '../../api/objects';
import {
  adminCreateCharacter,
  adminUpdateCharacter,
  adminUpdateCharacterTransform,
  adminDeleteCharacter,
  adminListCharacters,
} from '../../api/characters';
import {
  adminCreateLocation,
  adminDeleteLocation,
  adminUpdateLocationTransform,
  adminUpdateLocation,
  adminListLocations,
} from '../../api/locations';
import { adminCreateEvidence } from '../../api/evidences';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import { useImageSize } from '../../hooks/useImageSize';
import type { IdentifiedBounds } from '../../utils/collision';
import type { LocationScene } from '../../types/scene';
import type { Location } from '../../types/location';
import type { CharacterAdmin } from '../../types/character';
import type { ApiErrorResponse } from '../../types/api';

type Selection =
  | { type: 'entry' }
  | { type: 'object'; id: string }
  | { type: 'character'; id: string }
  | { type: 'sublocation'; id: string }
  | { type: 'exit'; id: string }
  | null;

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type ObjectModalState = 'new' | { id: string } | null;
type CharacterModalState = 'new' | { id: string } | null;

interface SubLocation {
  id: string;
  name: string;
  mediaId: string | null;
  posX: number;
  posY: number;
  scale: number;
  rotation: number;
  locationType: string;
}

const BASE_SIZE = {
  entry: 40,
  object: 90,
  character: 140,
  sublocation: 120,
  exit: 56,
} as const;

const SCENE_FALLBACK_W = 1200;
const SCENE_FALLBACK_H = 800;

export function SceneEditorPage() {
  const { caseId, locationId } = useParams<{
    caseId: string;
    locationId: string;
  }>();

  const contentRef = useRef<HTMLDivElement | null>(null);

  const [scene, setScene] = useState<LocationScene | null>(null);
  const [subLocations, setSubLocations] = useState<SubLocation[]>([]);
  const [characters, setCharacters] = useState<CharacterAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Selection>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const [pinSizes, setPinSizes] = useState<
    Map<string, { w: number; h: number }>
  >(new Map());

  const [zoom, setZoom] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(true);

  const [objectModal, setObjectModal] = useState<ObjectModalState>(null);
  const [characterModal, setCharacterModal] = useState<CharacterModalState>(null);
  const [subLocationModalOpen, setSubLocationModalOpen] = useState(false);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [evidenceModalFor, setEvidenceModalFor] = useState<{
    objectId: string;
    objectName: string;
  } | null>(null);

  const bgUrl = useMediaUrl(scene?.location.mediaId ?? null);
  const naturalSize = useImageSize(bgUrl);

  const sceneSize = useMemo(() => {
    if (naturalSize && naturalSize.width > 100 && naturalSize.height > 100) {
      return { width: naturalSize.width, height: naturalSize.height };
    }
    return { width: SCENE_FALLBACK_W, height: SCENE_FALLBACK_H };
  }, [naturalSize]);

  const handlePinSize = useCallback(
    (id: string, size: { w: number; h: number }) => {
      setPinSizes((prev) => {
        const cur = prev.get(id);
        if (cur && cur.w === size.w && cur.h === size.h) return prev;
        const next = new Map(prev);
        next.set(id, size);
        return next;
      });
    },
    []
  );

  const reload = useCallback(async () => {
    if (!locationId || !caseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [sc, allLocations, allChars] = await Promise.all([
        getScene(locationId),
        adminListLocations(caseId),
        adminListCharacters(caseId).catch(() => [] as CharacterAdmin[]),
      ]);
      setScene(sc);
      setCharacters(allChars.filter((c) => c.locationId === locationId));

      const subs: SubLocation[] = allLocations
        .filter((l: Location) => l.parentId === locationId)
        .map((l: Location) => ({
          id: l.id,
          name: l.name,
          mediaId: l.mapMediaId,
          posX: l.entryX,
          posY: l.entryY,
          scale: l.sceneScale,
          rotation: l.sceneRotation,
          locationType: l.locationType,
        }));
      setSubLocations(subs);
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось загрузить сцену.');
    } finally {
      setIsLoading(false);
    }
  }, [locationId, caseId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const flashSaved = useCallback(() => {
    setSaveStatus('saved');
    window.setTimeout(() => setSaveStatus('idle'), 1200);
  }, []);
  const flashError = useCallback(() => {
    setSaveStatus('error');
    window.setTimeout(() => setSaveStatus('idle'), 2500);
  }, []);

  const handlePinTransform = useCallback(
    async (pinId: string, patch: SceneTransform) => {
      if (!scene) return;

      if (pinId === 'entry-main') {
        const prev = { x: scene.location.entryX, y: scene.location.entryY };
        setScene({
          ...scene,
          location: { ...scene.location, entryX: patch.x, entryY: patch.y },
        });
        setSaveStatus('saving');
        try {
          await updateLocationEntry(scene.location.id, patch.x, patch.y);
          flashSaved();
        } catch {
          setScene((s) =>
            s
              ? {
                  ...s,
                  location: { ...s.location, entryX: prev.x, entryY: prev.y },
                }
              : s
          );
          flashError();
        }
        return;
      }

      if (pinId.startsWith('obj-')) {
        const id = pinId.slice(4);
        const prevObj = scene.objects.find((o) => o.id === id);
        if (!prevObj) return;
        setScene({
          ...scene,
          objects: scene.objects.map((o) =>
            o.id === id
              ? {
                  ...o,
                  posX: patch.x,
                  posY: patch.y,
                  sceneScale: patch.scale,
                  sceneRotation: patch.rotation,
                }
              : o
          ),
        });
        setSaveStatus('saving');
        try {
          await adminUpdateObjectTransform(id, {
            posX: patch.x,
            posY: patch.y,
            scale: patch.scale,
            rotation: patch.rotation,
          });
          flashSaved();
        } catch {
          setScene((s) =>
            s
              ? {
                  ...s,
                  objects: s.objects.map((o) =>
                    o.id === id
                      ? {
                          ...o,
                          posX: prevObj.posX,
                          posY: prevObj.posY,
                          sceneScale: prevObj.sceneScale,
                          sceneRotation: prevObj.sceneRotation,
                        }
                      : o
                  ),
                }
              : s
          );
          flashError();
        }
        return;
      }

      if (pinId.startsWith('char-')) {
        const id = pinId.slice(5);
        const prevChar = characters.find((c) => c.id === id);
        if (!prevChar) return;
        setCharacters((cur) =>
          cur.map((c) =>
            c.id === id
              ? {
                  ...c,
                  posX: patch.x,
                  posY: patch.y,
                  sceneScale: patch.scale,
                  sceneRotation: patch.rotation,
                }
              : c
          )
        );
        setSaveStatus('saving');
        try {
          await adminUpdateCharacterTransform(id, {
            posX: patch.x,
            posY: patch.y,
            scale: patch.scale,
            rotation: patch.rotation,
          });
          flashSaved();
        } catch {
          setCharacters((cur) =>
            cur.map((c) =>
              c.id === id
                ? {
                    ...c,
                    posX: prevChar.posX,
                    posY: prevChar.posY,
                    sceneScale: prevChar.sceneScale,
                    sceneRotation: prevChar.sceneRotation,
                  }
                : c
            )
          );
          flashError();
        }
        return;
      }

      if (pinId.startsWith('sub-')) {
        const id = pinId.slice(4);
        const prev = subLocations.find((s) => s.id === id);
        if (!prev) return;
        setSubLocations((cur) =>
          cur.map((s) =>
            s.id === id
              ? {
                  ...s,
                  posX: patch.x,
                  posY: patch.y,
                  scale: patch.scale,
                  rotation: patch.rotation,
                }
              : s
          )
        );
        setSaveStatus('saving');
        try {
          await adminUpdateLocationTransform(id, {
            posX: patch.x,
            posY: patch.y,
            scale: patch.scale,
            rotation: patch.rotation,
          });
          flashSaved();
        } catch {
          setSubLocations((cur) =>
            cur.map((s) =>
              s.id === id
                ? {
                    ...s,
                    posX: prev.posX,
                    posY: prev.posY,
                    scale: prev.scale,
                    rotation: prev.rotation,
                  }
                : s
            )
          );
          flashError();
        }
        return;
      }

      if (pinId.startsWith('exit-')) {
        const id = pinId.slice(5);
        const prevCon = scene.connections.find((c) => c.id === id);
        if (!prevCon) return;
        setScene({
          ...scene,
          connections: scene.connections.map((c) =>
            c.id === id ? { ...c, posX: patch.x, posY: patch.y } : c
          ),
        });
        setSaveStatus('saving');
        try {
          await updateConnectionPosition(id, patch.x, patch.y);
          flashSaved();
        } catch {
          setScene((s) =>
            s
              ? {
                  ...s,
                  connections: s.connections.map((c) =>
                    c.id === id
                      ? { ...c, posX: prevCon.posX, posY: prevCon.posY }
                      : c
                  ),
                }
              : s
          );
          flashError();
        }
      }
    },
    [scene, subLocations, characters, flashSaved, flashError]
  );

  const editingObject = useMemo(() => {
    if (!objectModal || objectModal === 'new') return null;
    return scene?.objects.find((o) => o.id === objectModal.id) ?? null;
  }, [objectModal, scene]);

  const handleSaveObject = async (data: ObjectModalSaveData) => {
    if (!locationId) return;
    const common = {
      name: data.name,
      description: data.description || undefined,
      objectType: data.objectType,
      state: data.state,
      mediaId: data.mediaId,
      sortOrder: data.sortOrder,
      renderLayer: data.renderLayer,
      walkable: data.walkable,
    };
    try {
      if (objectModal === 'new') {
        await adminCreateObject(locationId, common);
      } else if (objectModal) {
        await adminUpdateObject(objectModal.id, common);
      }
      setObjectModal(null);
      await reload();
      flashSaved();
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      alert(apiError.response?.data?.message ?? 'Не удалось сохранить объект');
      try {
        await reload();
      } catch {
        /* ignore */
      }
    }
  };

  const handleDeleteObject = async (id: string) => {
    if (!confirm('Удалить объект?')) return;
    try {
      await adminDeleteObject(id);
      setSelected(null);
      await reload();
    } catch {
      alert('Не удалось удалить');
    }
  };

  const editingCharacter = useMemo(() => {
    if (!characterModal || characterModal === 'new') return null;
    return characters.find((c) => c.id === characterModal.id) ?? null;
  }, [characterModal, characters]);

// внутри SceneEditorPage, замени handleSaveCharacter:

  const handleSaveCharacter = async (data: CharacterModalSaveData) => {
    if (!caseId || !locationId) return;
    const common = {
      name: data.name,
      description: data.description || undefined,
      biography: data.biography || undefined,
      locationId: data.locationId ?? locationId,
      portraitMediaId: data.portraitMediaId,
      dialogueMediaId: data.dialogueMediaId,
      sortOrder: data.sortOrder,
    };
    try {
      if (characterModal === 'new') {
        await adminCreateCharacter(caseId, common);
      } else if (characterModal) {
        await adminUpdateCharacter(characterModal.id, common);
      }
      setCharacterModal(null);
      await reload();
      flashSaved();
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      alert(apiError.response?.data?.message ?? 'Не удалось сохранить персонажа');
      try {
        await reload();
      } catch {
        /* ignore */
      }
    }
  };

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm('Удалить персонажа и все его диалоги?')) return;
    try {
      await adminDeleteCharacter(id);
      setSelected(null);
      await reload();
    } catch {
      alert('Не удалось удалить');
    }
  };

  const handleCreateSubLocation = async (data: LocationModalSaveData) => {
    if (!caseId || !locationId) return;
    try {
      await adminCreateLocation(caseId, {
        name: data.name,
        description: data.description || undefined,
        locationType: data.locationType,
        parentId: locationId,
        mediaId: data.mediaId,
        previewMediaId: data.previewMediaId,
        mapMediaId: data.mapMediaId,
        sortOrder: 0,
        discoveryMode: data.discoveryMode,
      });
      setSubLocationModalOpen(false);
      await reload();
      flashSaved();
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      alert(apiError.response?.data?.message ?? 'Не удалось создать под-локацию');
      try {
        await reload();
      } catch {
        /* ignore */
      }
    }
  };

  const handleDeleteSubLocation = async (id: string) => {
    if (!confirm('Удалить под-локацию?')) return;
    try {
      await adminDeleteLocation(id);
      setSelected(null);
      await reload();
    } catch {
      alert('Не удалось удалить');
    }
  };

  const handleCreateEvidence = async (data: EvidenceModalSaveData) => {
    if (!caseId) return;
    await adminCreateEvidence(caseId, {
      title: data.title,
      description: data.description || undefined,
      contentText: data.contentText || undefined,
      evidenceType: data.evidenceType,
      importance: data.importance,
      locationId: data.locationId,
      objectId: data.objectId,
      mediaId: data.mediaId,
      sortOrder: data.sortOrder,
    });
    setEvidenceModalFor(null);
    flashSaved();
  };

  const handleSaveBackground = async (mediaId: string | null) => {
    if (!scene) return;
    try {
      await adminUpdateLocation(scene.location.id, {
        name: scene.location.name,
        description: scene.location.description ?? undefined,
        locationType: scene.location.locationType,
        parentId: scene.location.parentId,
        mediaId,
        previewMediaId: scene.location.previewMediaId,
        mapMediaId: scene.location.mapMediaId,
        sortOrder: scene.location.sortOrder,
      });
      setBackgroundOpen(false);
      await reload();
      flashSaved();
    } catch {
      flashError();
    }
  };

  const pins: ScenePinData[] = useMemo(() => {
    if (!scene) return [];
    const result: ScenePinData[] = [];

    result.push({
      id: 'entry-main',
      x: scene.location.entryX,
      y: scene.location.entryY,
      variant: 'entry',
      label: 'Точка входа',
      subtitle: 'старт игрока',
      scale: 1,
      rotation: 0,
    });

    scene.objects.forEach((o) => {
      result.push({
        id: `obj-${o.id}`,
        x: o.posX,
        y: o.posY,
        variant: 'object',
        label: o.name,
        mediaId: o.mediaId,
        emoji: '🔍',
        subtitle: o.objectType,
        scale: o.sceneScale,
        rotation: o.sceneRotation,
        objectType: o.objectType,
        renderLayer: o.renderLayer,
      });
    });

    subLocations.forEach((s) => {
      result.push({
        id: `sub-${s.id}`,
        x: s.posX,
        y: s.posY,
        variant: 'sublocation',
        label: s.name,
        mediaId: s.mediaId,
        emoji: '🚪',
        subtitle: s.locationType,
        scale: s.scale,
        rotation: s.rotation,
      });
    });

    characters.forEach((c) => {
      result.push({
        id: `char-${c.id}`,
        x: c.posX,
        y: c.posY,
        variant: 'character',
        label: c.name,
        mediaId: c.portraitMediaId,
        emoji: '🧑',
        subtitle: 'персонаж',
        scale: c.sceneScale,
        rotation: c.sceneRotation,
      });
    });

    scene.connections
      .filter((c) => c.posX != null && c.posY != null)
      .forEach((c) => {
        result.push({
          id: `exit-${c.id}`,
          x: c.posX as number,
          y: c.posY as number,
          variant: 'exit',
          label: c.label ?? 'Переход',
          emoji: '→',
          scale: 1,
          rotation: 0,
        });
      });

    return result;
  }, [scene, subLocations, characters]);

  const sortedPins = useMemo(
    () => [...pins].sort((a, b) => a.y - b.y),
    [pins]
  );

  const sceneObstacles: IdentifiedBounds[] = useMemo(() => {
    const W = sceneSize.width;
    const H = sceneSize.height;
    const result: IdentifiedBounds[] = [];

    const fallback = (variant: keyof typeof BASE_SIZE) => ({
      w: BASE_SIZE[variant],
      h: BASE_SIZE[variant],
    });

    scene?.objects.forEach((o) => {
      if (o.walkable) return;
      const size = pinSizes.get(`obj-${o.id}`) ?? fallback('object');
      result.push({
        id: `obj-${o.id}`,
        x: o.posX,
        y: o.posY,
        halfW: (size.w / 2 / W) * 100,
        halfH: (size.h / 2 / H) * 100,
      });
    });

    characters.forEach((c) => {
      const size = pinSizes.get(`char-${c.id}`) ?? fallback('character');
      result.push({
        id: `char-${c.id}`,
        x: c.posX,
        y: c.posY,
        halfW: (size.w / 2 / W) * 100,
        halfH: (size.h / 2 / H) * 100,
      });
    });

    subLocations.forEach((sub) => {
      const size = pinSizes.get(`sub-${sub.id}`) ?? fallback('sublocation');
      result.push({
        id: `sub-${sub.id}`,
        x: sub.posX,
        y: sub.posY,
        halfW: (size.w / 2 / W) * 100,
        halfH: (size.h / 2 / H) * 100,
      });
    });

    return result;
  }, [scene, characters, subLocations, sceneSize, pinSizes]);

  if (isLoading) {
    return (
      <Container>
        <section className="py-10">
          <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted">
            Готовим сцену…
          </div>
        </section>
      </Container>
    );
  }

  if (error || !scene || !caseId || !locationId) {
    return (
      <Container>
        <section className="py-10">
          <div className="border border-blood/40 bg-blood/10 p-6 max-w-2xl">
            <div className="type text-[12px] uppercase tracking-[0.28em] text-blood mb-2">
              Ошибка
            </div>
            <div className="text-bone text-base mb-4">
              {error ?? 'Сцена недоступна.'}
            </div>
            <Link
              to={`/admin/cases/${caseId}/map`}
              className="type text-[12px] uppercase tracking-[0.24em]
                         text-blood hover:text-blood-hover"
            >
              ← К карте
            </Link>
          </div>
        </section>
      </Container>
    );
  }

  return (
    <Container>
      <section className="py-4 md:py-6">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <Link
            to={`/admin/cases/${caseId}/map`}
            className="type text-[12px] uppercase tracking-[0.28em]
                       text-bone-muted hover:text-bone transition-colors"
          >
            ← К карте
          </Link>
          <span className="text-bone-dim/50">·</span>
          <Link
            to={`/admin/cases/${caseId}`}
            className="type text-[12px] uppercase tracking-[0.28em]
                       text-bone-muted hover:text-bone transition-colors"
          >
            К делу
          </Link>
        </div>

        <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
          <div>
            <div className="type text-[11px] uppercase tracking-[0.3em] text-brass mb-1">
              Сцена локации
            </div>
            <h1 className="text-[clamp(1.3rem,3vw,2rem)] leading-[0.95] text-texture-bone">
              {scene.location.name}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {saveStatus !== 'idle' && (
              <span
                className={
                  'type text-[11px] uppercase tracking-[0.24em] px-3 py-1.5 ' +
                  'border bg-ink/70 ' +
                  (saveStatus === 'error'
                    ? 'border-blood/60 text-blood'
                    : saveStatus === 'saved'
                    ? 'border-green-600/60 text-green-300'
                    : 'border-brass/40 text-brass')
                }
              >
                {saveStatus === 'saving'
                  ? 'Сохраняем…'
                  : saveStatus === 'saved'
                  ? '✓'
                  : 'Ошибка'}
              </span>
            )}

            <button
              onClick={() => setBackgroundOpen(true)}
              className="px-3 py-2 border border-brass/40 text-brass
                         type text-[11px] uppercase tracking-[0.22em]
                         hover:bg-brass/10 transition-colors cursor-pointer"
            >
              🖼 Фон
            </button>
            <button
              onClick={() => setObjectModal('new')}
              className="px-3 py-2 border border-brass/40 text-brass
                         type text-[11px] uppercase tracking-[0.22em]
                         hover:bg-brass/10 transition-colors cursor-pointer"
            >
              + Объект
            </button>
            <button
              onClick={() => setCharacterModal('new')}
              className="px-3 py-2 border border-brass/40 text-brass
                         type text-[11px] uppercase tracking-[0.22em]
                         hover:bg-brass/10 transition-colors cursor-pointer"
            >
              + Персонаж
            </button>
            <button
              onClick={() => setSubLocationModalOpen(true)}
              className="px-3 py-2 border border-brass/40 text-brass
                         type text-[11px] uppercase tracking-[0.22em]
                         hover:bg-brass/10 transition-colors cursor-pointer"
            >
              + Под-локация
            </button>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <div className="flex-1 min-w-0">
            <div
              className="relative w-full border border-brass/30 bg-ink-soft overflow-hidden"
              style={{ height: 'calc(100vh - 260px)', minHeight: 400 }}
            >
              <MapPanContainer
                width={sceneSize.width}
                height={sceneSize.height}
                disabled={false}
                zoom={zoom}
                onZoomChange={setZoom}
                contentRef={contentRef}
                fitMinZoomToViewport
                fitMinZoomMode="cover"
                className="w-full h-full"
              >
                {bgUrl ? (
                  <img
                    src={bgUrl}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 w-full h-full
                               pointer-events-none select-none"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center
                                  type text-[13px] uppercase tracking-[0.28em]
                                  text-bone-dim text-center px-6 pointer-events-none">
                    Фон локации не задан.
                    <br />
                    Нажмите «🖼 Фон» в шапке.
                  </div>
                )}

                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(201,162,74,0.15) 1px, transparent 1px),' +
                      'linear-gradient(90deg, rgba(201,162,74,0.15) 1px, transparent 1px)',
                    backgroundSize: '10% 10%',
                  }}
                />

                <div
                  className="absolute inset-0"
                  style={{ zIndex: 20 }}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setSelected(null);
                      setHoveredId(null);
                    }
                  }}
                >
                  {sortedPins.map((p) => {
                    const canTransform =
                      p.variant === 'object' ||
                      p.variant === 'character' ||
                      p.variant === 'sublocation';

                    const collidable =
                      p.variant === 'object' ||
                      p.variant === 'character' ||
                      p.variant === 'sublocation';

                    return (
                      <ScenePin
                        key={p.id}
                        pin={p}
                        baseSize={BASE_SIZE[p.variant]}
                        canTransform={canTransform}
                        collidable={collidable}
                        obstacles={sceneObstacles}
                        sceneWidth={sceneSize.width}
                        sceneHeight={sceneSize.height}
                        selected={
                          (p.variant === 'entry' && selected?.type === 'entry') ||
                          (p.variant === 'object' &&
                            selected?.type === 'object' &&
                            p.id === `obj-${selected.id}`) ||
                          (p.variant === 'character' &&
                            selected?.type === 'character' &&
                            p.id === `char-${selected.id}`) ||
                          (p.variant === 'sublocation' &&
                            selected?.type === 'sublocation' &&
                            p.id === `sub-${selected.id}`) ||
                          (p.variant === 'exit' &&
                            selected?.type === 'exit' &&
                            p.id === `exit-${selected.id}`)
                        }
                        hovered={hoveredId === p.id}
                        onSelect={(pinId) => {
                          if (pinId === 'entry-main') {
                            setSelected({ type: 'entry' });
                          } else if (pinId.startsWith('obj-')) {
                            setSelected({ type: 'object', id: pinId.slice(4) });
                          } else if (pinId.startsWith('sub-')) {
                            setSelected({ type: 'sublocation', id: pinId.slice(4) });
                          } else if (pinId.startsWith('char-')) {
                            setSelected({ type: 'character', id: pinId.slice(5) });
                          } else if (pinId.startsWith('exit-')) {
                            setSelected({ type: 'exit', id: pinId.slice(5) });
                          }
                        }}
                        onHover={setHoveredId}
                        onTransformEnd={handlePinTransform}
                        onSizeResolved={handlePinSize}
                        containerRef={contentRef}
                        zoom={zoom}
                      />
                    );
                  })}
                </div>
              </MapPanContainer>
            </div>
          </div>

          {sidebarOpen ? (
            <aside
              className="hidden lg:flex flex-col w-80 shrink-0
                         border border-brass/30 bg-ink/70 p-4
                         max-h-[calc(100vh-260px)] overflow-y-auto scroll-map"
              style={{
                boxShadow:
                  'inset 0 1px 0 rgba(201,162,74,0.12), 0 12px 40px rgba(0,0,0,0.55)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="type text-[10px] uppercase tracking-[0.3em] text-brass">
                  {selected ? 'Свойства' : 'Как работать'}
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-7 h-7 flex items-center justify-center
                             text-bone-muted hover:text-bone
                             type text-[12px] transition-colors cursor-pointer"
                  title="Свернуть"
                >
                  ▶
                </button>
              </div>

              {!selected ? (
                <>
                  <button
                    onClick={() => setHelpOpen((v) => !v)}
                    className="flex items-center justify-between w-full
                               pb-2 mb-3 border-b border-brass/25
                               text-left cursor-pointer"
                  >
                    <span className="type text-[10px] uppercase tracking-[0.24em]
                                     text-bone-muted">
                      Справка
                    </span>
                    <span className="type text-[10px] text-brass">
                      {helpOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {helpOpen && (
                    <ul className="space-y-2 text-bone-muted text-[12px] leading-relaxed">
                      <li>• Тащи маркеры — сохраняется автоматически.</li>
                      <li>• Углы — пропорциональный ресайз.</li>
                      <li>• Кружок сверху — поворот.</li>
                      <li>• Маркеры не проходят сквозь друг друга.</li>
                      <li>• Клик по пустому месту — снять выделение.</li>
                      <li>
                        • <strong className="text-brass">+ Объект</strong> — точка
                        интереса.
                      </li>
                      <li>
                        • <strong className="text-brass">+ Персонаж</strong> — NPC
                        в сцене.
                      </li>
                      <li>
                        • <strong className="text-brass">🖼 Фон</strong> — картинка
                        сцены.
                      </li>
                    </ul>
                  )}

                  <div className="mt-5 pt-3 border-t border-brass/20 space-y-2 text-bone-muted text-[12px]">
                    <div className="flex justify-between">
                      <span>Объектов</span>
                      <span className="text-bone">{scene.objects.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Персонажей</span>
                      <span className="text-bone">{characters.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Под-локаций</span>
                      <span className="text-bone">{subLocations.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Переходов</span>
                      <span className="text-bone">
                        {scene.connections.filter((c) => c.posX != null).length}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <SidebarContent
                  scene={scene}
                  subLocations={subLocations}
                  characters={characters}
                  selected={selected}
                  caseId={caseId}
                  onDeselect={() => setSelected(null)}
                  onDeleteObject={handleDeleteObject}
                  onDeleteCharacter={handleDeleteCharacter}
                  onDeleteSubLocation={handleDeleteSubLocation}
                  onEditObject={(id) => setObjectModal({ id })}
                  onEditCharacter={(id) => setCharacterModal({ id })}
                  onAddEvidence={(objectId, objectName) =>
                    setEvidenceModalFor({ objectId, objectName })
                  }
                />
              )}
            </aside>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="hidden lg:flex items-center justify-center w-8 shrink-0
                         border border-brass/30 bg-ink/70
                         type text-[12px] text-brass
                         hover:bg-brass/10 transition-colors cursor-pointer"
              style={{ height: 120 }}
              title="Развернуть панель"
            >
              ◀
            </button>
          )}
        </div>
      </section>

      {objectModal && (
        <ObjectModal
          caseId={caseId}
          initial={editingObject}
          onSave={handleSaveObject}
          onClose={() => setObjectModal(null)}
        />
      )}

      {characterModal && (
        <CharacterModal
          caseId={caseId}
          initial={editingCharacter}
          presetLocationId={characterModal === 'new' ? locationId : null}
          presetLocationName={
            characterModal === 'new' ? scene.location.name : undefined
          }
          onSave={handleSaveCharacter}
          onClose={() => setCharacterModal(null)}
        />
      )}

      {subLocationModalOpen && (
        <LocationModal
          caseId={caseId}
          locations={[]}
          defaultParentId={locationId}
          onSave={handleCreateSubLocation}
          onClose={() => setSubLocationModalOpen(false)}
        />
      )}

      {backgroundOpen && (
        <BackgroundModal
          caseId={caseId}
          locationId={locationId}
          value={scene.location.mediaId}
          onSave={handleSaveBackground}
          onClose={() => setBackgroundOpen(false)}
        />
      )}

      {evidenceModalFor && (
        <EvidenceModal
          caseId={caseId}
          presetLocationId={locationId}
          presetObjectId={evidenceModalFor.objectId}
          presetContext={{
            locationName: scene.location.name,
            objectName: evidenceModalFor.objectName,
          }}
          onSave={handleCreateEvidence}
          onClose={() => setEvidenceModalFor(null)}
        />
      )}
    </Container>
  );
}

/* SidebarContent, Row, BackgroundModal — без изменений */

interface SidebarContentProps {
  scene: LocationScene;
  subLocations: SubLocation[];
  characters: CharacterAdmin[];
  selected: Selection;
  caseId: string;
  onDeselect: () => void;
  onDeleteObject: (id: string) => void;
  onDeleteCharacter: (id: string) => void;
  onDeleteSubLocation: (id: string) => void;
  onEditObject: (id: string) => void;
  onEditCharacter: (id: string) => void;
  onAddEvidence: (objectId: string, objectName: string) => void;
}

function SidebarContent({
  scene,
  subLocations,
  characters,
  selected,
  caseId,
  onDeselect,
  onDeleteObject,
  onDeleteCharacter,
  onDeleteSubLocation,
  onEditObject,
  onEditCharacter,
  onAddEvidence,
}: SidebarContentProps) {
  if (!selected) return null;

  if (selected.type === 'entry') {
    return (
      <>
        <h3 className="font-poster text-lg text-bone leading-tight mb-2">
          Точка входа
        </h3>
        <p className="text-bone-muted text-[12px] mb-4">
          Где появится игрок, войдя сюда.
        </p>
        <div className="space-y-2 text-bone text-[12px]">
          <Row label="X" value={`${scene.location.entryX.toFixed(1)}%`} />
          <Row label="Y" value={`${scene.location.entryY.toFixed(1)}%`} />
        </div>
        <button
          onClick={onDeselect}
          className="mt-6 w-full px-3 py-2 border border-bone/25 text-bone-muted
                     type text-[11px] uppercase tracking-[0.24em]
                     hover:text-bone hover:border-bone/60
                     transition-colors cursor-pointer"
        >
          Снять выделение
        </button>
      </>
    );
  }

  if (selected.type === 'object') {
    const obj = scene.objects.find((o) => o.id === selected.id);
    if (!obj) return null;
    return (
      <>
        <h3 className="font-poster text-lg text-bone leading-tight mb-1">
          {obj.name}
        </h3>
        <div className="type text-[10px] uppercase tracking-[0.22em]
                        text-bone-muted mb-3">
          {obj.objectType} · {obj.state}
        </div>

        {obj.description && (
          <p className="text-bone-muted text-[12px] leading-relaxed mb-4
                        whitespace-pre-line">
            {obj.description}
          </p>
        )}

        <div className="flex flex-col gap-1.5 mb-4 text-bone text-[12px]">
          <Row label="X" value={`${obj.posX.toFixed(1)}%`} />
          <Row label="Y" value={`${obj.posY.toFixed(1)}%`} />
          <Row label="Scale" value={`${obj.sceneScale.toFixed(2)}×`} />
          <Row label="Поворот" value={`${Math.round(obj.sceneRotation)}°`} />
          <Row label="Слой" value={String(obj.renderLayer)} />
          <Row label="Проходим" value={obj.walkable ? 'да' : 'нет'} />
        </div>

        <div className="flex flex-col gap-2 pt-3 border-t border-brass/20">
          <button
            onClick={() => onAddEvidence(obj.id, obj.name)}
            className="px-3 py-2 bg-blood text-paper
                       type text-[11px] uppercase tracking-[0.24em]
                       hover:bg-blood-hover transition-colors cursor-pointer"
          >
            + Улика на этот объект
          </button>
          <Link
            to={`/admin/cases/${caseId}?tab=evidences`}
            className="px-3 py-2 border border-brass/40 text-brass
                       type text-[11px] uppercase tracking-[0.24em]
                       hover:bg-brass/10 transition-colors text-center"
          >
            🔍 Все улики объекта
          </Link>
          <button
            onClick={() => onEditObject(obj.id)}
            className="px-3 py-2 border border-brass/40 text-brass
                       type text-[11px] uppercase tracking-[0.24em]
                       hover:bg-brass/10 transition-colors cursor-pointer"
          >
            ✎ Изменить объект
          </button>
          <button
            onClick={() => onDeleteObject(obj.id)}
            className="px-3 py-2 border border-blood/40 text-blood
                       type text-[11px] uppercase tracking-[0.24em]
                       hover:bg-blood/10 transition-colors cursor-pointer"
          >
            Удалить объект
          </button>
          <button
            onClick={onDeselect}
            className="px-3 py-2 border border-bone/15 text-bone-dim
                       type text-[11px] uppercase tracking-[0.24em]
                       hover:text-bone-muted transition-colors cursor-pointer"
          >
            Снять выделение
          </button>
        </div>
      </>
    );
  }

  if (selected.type === 'sublocation') {
    const sub = subLocations.find((s) => s.id === selected.id);
    if (!sub) return null;
    return (
      <>
        <h3 className="font-poster text-lg text-bone leading-tight mb-1">
          {sub.name}
        </h3>
        <div className="type text-[10px] uppercase tracking-[0.22em]
                        text-bone-muted mb-3">
          под-локация · {sub.locationType}
        </div>

        <div className="flex flex-col gap-1.5 mb-4 text-bone text-[12px]">
          <Row label="X" value={`${sub.posX.toFixed(1)}%`} />
          <Row label="Y" value={`${sub.posY.toFixed(1)}%`} />
          <Row label="Scale" value={`${sub.scale.toFixed(2)}×`} />
          <Row label="Поворот" value={`${Math.round(sub.rotation)}°`} />
        </div>

        <div className="flex flex-col gap-2 pt-3 border-t border-brass/20">
          <Link
            to={`/admin/cases/${caseId}/scene/${sub.id}`}
            className="px-3 py-2 bg-brass/20 text-brass border border-brass/50
                       type text-[11px] uppercase tracking-[0.24em]
                       hover:bg-brass/30 transition-colors text-center"
          >
            🎨 Открыть под-локацию
          </Link>
          <button
            onClick={() => onDeleteSubLocation(sub.id)}
            className="px-3 py-2 border border-blood/40 text-blood
                       type text-[11px] uppercase tracking-[0.24em]
                       hover:bg-blood/10 transition-colors cursor-pointer"
          >
            Удалить под-локацию
          </button>
          <button
            onClick={onDeselect}
            className="px-3 py-2 border border-bone/15 text-bone-dim
                       type text-[11px] uppercase tracking-[0.24em]
                       hover:text-bone-muted transition-colors cursor-pointer"
          >
            Снять выделение
          </button>
        </div>
      </>
    );
  }

  if (selected.type === 'character') {
    const c = characters.find((x) => x.id === selected.id);
    if (!c) return null;
    return (
      <>
        <h3 className="font-poster text-lg text-bone leading-tight mb-1">
          {c.name}
        </h3>
        <div className="type text-[10px] uppercase tracking-[0.22em]
                        text-bone-muted mb-3">
          персонаж · {c.dialogs.length} диалогов
        </div>

        {c.description && (
          <p className="text-bone-muted text-[12px] leading-relaxed mb-4
                        whitespace-pre-line">
            {c.description}
          </p>
        )}

        <div className="flex flex-col gap-1.5 mb-4 text-bone text-[12px]">
          <Row label="X" value={`${c.posX.toFixed(1)}%`} />
          <Row label="Y" value={`${c.posY.toFixed(1)}%`} />
          <Row label="Scale" value={`${c.sceneScale.toFixed(2)}×`} />
          <Row label="Поворот" value={`${Math.round(c.sceneRotation)}°`} />
        </div>

        <div className="flex flex-col gap-2 pt-3 border-t border-brass/20">
          <Link
            to={`/admin/cases/${caseId}?tab=characters`}
            className="px-3 py-2 border border-brass/40 text-brass
                       type text-[11px] uppercase tracking-[0.24em]
                       hover:bg-brass/10 transition-colors text-center"
          >
            💬 Диалоги персонажа
          </Link>
          <button
            onClick={() => onEditCharacter(c.id)}
            className="px-3 py-2 border border-brass/40 text-brass
                       type text-[11px] uppercase tracking-[0.24em]
                       hover:bg-brass/10 transition-colors cursor-pointer"
          >
            ✎ Изменить персонажа
          </button>
          <button
            onClick={() => onDeleteCharacter(c.id)}
            className="px-3 py-2 border border-blood/40 text-blood
                       type text-[11px] uppercase tracking-[0.24em]
                       hover:bg-blood/10 transition-colors cursor-pointer"
          >
            Удалить персонажа
          </button>
          <button
            onClick={onDeselect}
            className="px-3 py-2 border border-bone/15 text-bone-dim
                       type text-[11px] uppercase tracking-[0.24em]
                       hover:text-bone-muted transition-colors cursor-pointer"
          >
            Снять выделение
          </button>
        </div>
      </>
    );
  }

  if (selected.type === 'exit') {
    const c = scene.connections.find((x) => x.id === selected.id);
    if (!c) return null;
    return (
      <>
        <h3 className="font-poster text-lg text-bone leading-tight mb-2">
          {c.label ?? 'Переход'}
        </h3>
        <div className="type text-[10px] uppercase tracking-[0.22em]
                        text-bone-muted mb-4">
          переход
        </div>
        <div className="space-y-2 text-bone text-[12px]">
          <Row label="X" value={c.posX != null ? `${c.posX.toFixed(1)}%` : '—'} />
          <Row label="Y" value={c.posY != null ? `${c.posY.toFixed(1)}%` : '—'} />
        </div>
        <button
          onClick={onDeselect}
          className="mt-6 w-full px-3 py-2 border border-bone/15 text-bone-dim
                     type text-[11px] uppercase tracking-[0.24em]
                     hover:text-bone-muted transition-colors cursor-pointer"
        >
          Снять выделение
        </button>
      </>
    );
  }

  return null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="type text-[10px] uppercase tracking-[0.24em] text-bone-muted">
        {label}
      </span>
      <span className="type text-[11px] text-bone">{value}</span>
    </div>
  );
}

function BackgroundModal({
  caseId,
  locationId,
  value,
  onSave,
  onClose,
}: {
  caseId: string;
  locationId: string;
  value: string | null;
  onSave: (mediaId: string | null) => void;
  onClose: () => void;
}) {
  const [mediaId, setMediaId] = useState<string | null>(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(mediaId);
    } finally {
      setIsSaving(false);
    }
  };

  void locationId;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6
                 bg-ink/85 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl border-2 border-brass/50 bg-ink/95 p-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="type text-[11px] uppercase tracking-[0.32em] text-brass
                        pb-3 mb-5 border-b border-brass/25">
          Фон локации
        </div>

        <MediaUploader
          caseId={caseId}
          value={mediaId}
          onChange={setMediaId}
          label="Картинка локации"
          hint="Что видит игрок, войдя сюда. Не обязательно."
          aspect="video"
        />

        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-bone/25 text-bone-muted
                       type text-[11px] uppercase tracking-[0.24em]
                       hover:text-bone hover:border-bone/60
                       transition-colors cursor-pointer disabled:opacity-40"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blood text-paper px-4 py-2
                       type text-[11px] uppercase tracking-[0.24em]
                       hover:bg-blood-hover transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}