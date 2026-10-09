import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container } from '../../components/layout/Container';
import { MapPanContainer } from '../../components/admin/map/MapPanContainer';
import {
  LocationNode,
  NODE_WIDTH,
  NODE_HEIGHT,
  // computeNodeSize,  // ← ИСПРАВЛЕНО: удалено, не использовалось
  type MapTransform,
} from '../../components/admin/map/LocationNode';
import { ConnectionLine } from '../../components/admin/map/ConnectionLine';
import { MapSettingsModal } from '../../components/admin/map/MapSettingsModal';
import {
  LocationModal,
  type LocationModalSaveData,
} from '../../components/admin/map/LocationModal';
import { DeleteLocationModal } from '../../components/admin/map/DeleteLocationModal';
import {
  adminListLocations,
  adminUpdateLocationTransform,
  adminCreateLocation,
  adminUpdateLocation,
  adminDeleteLocation,
  adminGetLocationDeleteInfo,
  type LocationDeleteInfo,
} from '../../api/locations';
import {
  adminListConnections,
  adminDeleteConnection,
  adminCreateConnection,
} from '../../api/connections';
import { adminListEvidences } from '../../api/evidences';
import { adminListCharacters } from '../../api/characters';
import { getAdminCase, updateCaseMapSettings } from '../../api/admin';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import { useImageSize } from '../../hooks/useImageSize';
import type { IdentifiedBounds } from '../../utils/collision';
import type { Case } from '../../types/case';
import type { Location } from '../../types/location';
import type { LocationConnection } from '../../types/connection';
import type { ApiErrorResponse } from '../../types/api';

const MAP_FALLBACK_W = 2400;
const MAP_FALLBACK_H = 1600;

export function MapEditorPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [connections, setConnections] = useState<LocationConnection[]>([]);
  const [evidences, setEvidences] = useState<{ id: string; label: string }[]>([]);
  const [characters, setCharacters] = useState<{ id: string; label: string }[]>([]);

  /** Размеры карточек (после расчёта по натуральным пропорциям). */
  const [nodeSizes, setNodeSizes] = useState<
    Map<string, { w: number; h: number }>
  >(new Map());

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');

  const [zoom, setZoom] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(true);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editLocationId, setEditLocationId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<LocationDeleteInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [linkSource, setLinkSource] = useState<string | null>(null);
  const [linkTarget, setLinkTarget] = useState<string | null>(null);
  const [linkLabel, setLinkLabel] = useState('');
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const mapBgUrl = useMediaUrl(caseData?.mapMediaId ?? null);
  const naturalSize = useImageSize(mapBgUrl);

  const rootLocations = useMemo(
    () => (locations ? locations.filter((l) => !l.parentId) : []),
    [locations]
  );

  /**
   * Собираем размеры нод, которые сообщают сами `LocationNode`
   * после того, как у них загрузятся натуральные размеры PNG.
   */
  const handleNodeSize = useCallback(
    (id: string, size: { w: number; h: number }) => {
      setNodeSizes((prev) => {
        const cur = prev.get(id);
        if (cur && cur.w === size.w && cur.h === size.h) return prev;
        const next = new Map(prev);
        next.set(id, size);
        return next;
      });
    },
    []
  );

  /** Размер конкретной ноды (по кешу) или дефолт. */
  const sizeOf = useCallback(
    (id: string): { w: number; h: number } => {
      return nodeSizes.get(id) ?? { w: NODE_WIDTH, h: NODE_HEIGHT };
    },
    [nodeSizes]
  );

  /* Полотно = максимум из (размер картинки, размер под корневые локации). */
  const mapSize = useMemo(() => {
    let baseW = MAP_FALLBACK_W;
    let baseH = MAP_FALLBACK_H;

    if (naturalSize && naturalSize.width > 100 && naturalSize.height > 100) {
      baseW = naturalSize.width;
      baseH = naturalSize.height;
    } else if (caseData?.mapWidth && caseData.mapHeight) {
      if (caseData.mapWidth > 100) baseW = caseData.mapWidth;
      if (caseData.mapHeight > 100) baseH = caseData.mapHeight;
    }

    if (rootLocations.length === 0) {
      return { width: baseW, height: baseH };
    }

    let maxX = baseW;
    let maxY = baseH;
    for (const l of rootLocations) {
      const s = l.sceneScale ?? 1;
      const sz = sizeOf(l.id);
      const right = l.mapX + sz.w * s;
      const bottom = l.mapY + sz.h * s;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    }
    return { width: Math.ceil(maxX), height: Math.ceil(maxY) };
  }, [naturalSize, caseData, rootLocations, sizeOf]);

  const reload = useCallback(async () => {
    if (!caseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [c, locs, evs, chars] = await Promise.all([
        getAdminCase(caseId),
        adminListLocations(caseId),
        adminListEvidences(caseId).catch(() => []),
        adminListCharacters(caseId).catch(() => []),
      ]);
      setCaseData(c);
      setLocations(locs);
      setEvidences(evs.map((e) => ({ id: e.id, label: e.title })));
      setCharacters(chars.map((ch) => ({ id: ch.id, label: ch.name })));

      const roots = locs.filter((l) => !l.parentId);
      const conns: LocationConnection[] = [];
      for (const l of roots) {
        try {
          const list = await adminListConnections(l.id);
          conns.push(...list);
        } catch {
          /* ignore */
        }
      }
      const map = new Map<string, LocationConnection>();
      conns.forEach((x) => map.set(x.id, x));
      setConnections([...map.values()]);
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось загрузить карту.');
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

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

  const handleNodeTransform = useCallback(
    async (id: string, patch: MapTransform) => {
      if (!locations) return;
      const prev = locations.find((l) => l.id === id);
      if (!prev) return;

      setLocations((cur) =>
        cur
          ? cur.map((l) =>
              l.id === id
                ? {
                    ...l,
                    mapX: patch.x,
                    mapY: patch.y,
                    sceneScale: patch.scale,
                    sceneRotation: patch.rotation,
                  }
                : l
            )
          : cur
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
        setLocations((cur) =>
          cur
            ? cur.map((l) =>
                l.id === id
                  ? {
                      ...l,
                      mapX: prev.mapX,
                      mapY: prev.mapY,
                      sceneScale: prev.sceneScale,
                      sceneRotation: prev.sceneRotation,
                    }
                  : l
              )
            : cur
        );
        flashError();
      }
    },
    [locations, flashSaved, flashError]
  );

  const handleSaveSettings = async (data: {
    mapMediaId: string | null;
    entryLocationId: string | null;
    mapWidth: number;
    mapHeight: number;
  }) => {
    if (!caseId) return;
    try {
      const updated = await updateCaseMapSettings(caseId, data);
      setCaseData(updated);
      setSettingsOpen(false);
      flashSaved();
    } catch {
      flashError();
    }
  };

  const handleCreateLocation = async (data: LocationModalSaveData) => {
    if (!caseId || !caseData) return;
    const created = await adminCreateLocation(caseId, {
      name: data.name,
      description: data.description || undefined,
      locationType: data.locationType,
      parentId: data.parentId,
      mediaId: data.mediaId,
      previewMediaId: data.previewMediaId,
      mapMediaId: data.mapMediaId,
      sortOrder: data.sortOrder,
      discoveryMode: data.discoveryMode,
      discoveryTargetId: data.discoveryTargetId,
      discoveryHint: data.discoveryHint || undefined,
    });
    await adminUpdateLocationTransform(created.id, {
      posX: Math.round(mapSize.width / 2 - NODE_WIDTH / 2),
      posY: Math.round(mapSize.height / 2 - NODE_HEIGHT / 2),
      scale: 1,
      rotation: 0,
    });
    setCreateOpen(false);
    await reload();
    flashSaved();
  };

  const handleEditLocation = async (data: LocationModalSaveData) => {
    if (!editLocationId) return;
    await adminUpdateLocation(editLocationId, {
      name: data.name,
      description: data.description || undefined,
      locationType: data.locationType,
      parentId: data.parentId,
      mediaId: data.mediaId,
      previewMediaId: data.previewMediaId,
      mapMediaId: data.mapMediaId,
      sortOrder: data.sortOrder,
      discoveryMode: data.discoveryMode,
      discoveryTargetId: data.discoveryTargetId,
      discoveryHint: data.discoveryHint || undefined,
    });
    setEditLocationId(null);
    await reload();
    flashSaved();
  };

  const handleDeleteClick = async () => {
    if (!selected) return;
    try {
      const info = await adminGetLocationDeleteInfo(selected);
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
      setDeleteTarget(null);
      setSelected(null);
      await reload();
      flashSaved();
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      alert(apiError.response?.data?.message ?? 'Не удалось удалить локацию.');
    } finally {
      setIsDeleting(false);
    }
  };

  const startLinkFrom = (sourceId: string) => {
    setLinkSource(sourceId);
    setLinkTarget(null);
    setLinkLabel('');
    setLinkError(null);
  };

  const cancelLink = () => {
    setLinkSource(null);
    setLinkTarget(null);
    setLinkLabel('');
    setLinkError(null);
  };

  const handleNodeSelect = useCallback(
    (id: string) => {
      if (linkSource) {
        if (id === linkSource) return;
        setLinkTarget(id);
        return;
      }
      setSelected(id);
    },
    [linkSource]
  );

  useEffect(() => {
    if (linkTarget) setLinkLabel('');
  }, [linkTarget]);

  const handleConfirmCreateLink = async () => {
    if (!linkSource || !linkTarget) return;
    setIsCreatingLink(true);
    setLinkError(null);
    try {
      await adminCreateConnection(linkSource, {
        toLocationId: linkTarget,
        label: linkLabel.trim() || undefined,
      });
      const fromList = await adminListConnections(linkSource);
      setConnections((cur) => {
        const others = cur.filter(
          (c) =>
            !(c.fromLocationId === linkSource && c.toLocationId === linkTarget)
        );
        return [
          ...others,
          ...fromList.filter((c) => c.toLocationId === linkTarget),
        ];
      });
      cancelLink();
      flashSaved();
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setLinkError(apiError.response?.data?.message ?? 'Не удалось создать связь');
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Удалить эту связь?')) return;
    try {
      await adminDeleteConnection(connectionId);
      setConnections((cur) => cur.filter((c) => c.id !== connectionId));
    } catch {
      alert('Не удалось удалить связь');
    }
  };

  /**
   * Препятствия для коллизий — берём актуальные размеры из nodeSizes.
   */
  const mapObstacles: IdentifiedBounds[] = useMemo(() => {
    return rootLocations.map((l) => {
      const s = l.sceneScale ?? 1;
      const sz = sizeOf(l.id);
      return {
        id: l.id,
        x: l.mapX + sz.w / 2,
        y: l.mapY + sz.h / 2,
        halfW: (sz.w * s) / 2,
        halfH: (sz.h * s) / 2,
      };
    });
  }, [rootLocations, sizeOf]);

  const sortedLocations = useMemo(
    () => [...rootLocations].sort((a, b) => a.mapY - b.mapY),
    [rootLocations]
  );

  const isBidirectional = useCallback(
    (from: string, to: string) =>
      connections.some((c) => c.fromLocationId === to && c.toLocationId === from),
    [connections]
  );

  const getLocation = (id: string) =>
    locations?.find((l) => l.id === id) ?? null;

  const visibleConnections = useMemo(() => {
    const focusId = selected || hoveredId;
    if (!focusId) return [];
    return connections.filter(
      (c) => c.fromLocationId === focusId || c.toLocationId === focusId
    );
  }, [connections, selected, hoveredId]);

  const selectedOutgoing = useMemo(
    () => (selected ? connections.filter((c) => c.fromLocationId === selected) : []),
    [connections, selected]
  );
  const selectedIncoming = useMemo(
    () => (selected ? connections.filter((c) => c.toLocationId === selected) : []),
    [connections, selected]
  );

  if (isLoading) {
    return (
      <Container>
        <section className="py-10">
          <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted">
            Разворачиваем карту…
          </div>
        </section>
      </Container>
    );
  }

  if (error || !locations || !caseId || !caseData) {
    return (
      <Container>
        <section className="py-10">
          <div className="border border-blood/40 bg-blood/10 p-6 max-w-2xl">
            <div className="type text-[12px] uppercase tracking-[0.28em] text-blood mb-2">
              Ошибка
            </div>
            <div className="text-bone text-base mb-4">
              {error ?? 'Карта недоступна.'}
            </div>
            <Link
              to={`/admin/cases/${caseId}`}
              className="type text-[12px] uppercase tracking-[0.24em]
                         text-blood hover:text-blood-hover"
            >
              ← К делу
            </Link>
          </div>
        </section>
      </Container>
    );
  }

  const selectedLoc = selected ? getLocation(selected) : null;
  const linkSourceLoc = linkSource ? getLocation(linkSource) : null;
  const linkTargetLoc = linkTarget ? getLocation(linkTarget) : null;
  const editTarget = editLocationId
    ? locations.find((l) => l.id === editLocationId) ?? null
    : null;

  return (
    <Container>
      <section className="py-4 md:py-6">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <Link
            to={`/admin/cases/${caseId}`}
            className="type text-[12px] uppercase tracking-[0.28em]
                       text-bone-muted hover:text-bone transition-colors"
          >
            ← К делу
          </Link>
          <span className="text-bone-dim/50">·</span>
          <span className="type text-[12px] uppercase tracking-[0.28em] text-brass">
            Карта дела
          </span>
        </div>

        <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h1 className="text-[clamp(1.3rem,3vw,2rem)] leading-[0.95] text-texture-bone">
              Схема локаций
            </h1>
            <div className="type text-[11px] uppercase tracking-[0.26em] text-bone-muted mt-1">
              {rootLocations.length} корневых · {locations.length} всего ·{' '}
              {connections.length} связей · полотно {mapSize.width}×{mapSize.height}
            </div>
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
              onClick={() => setSettingsOpen(true)}
              className="px-3 py-2 border border-brass/40 text-brass
                         type text-[11px] uppercase tracking-[0.22em]
                         hover:bg-brass/10 transition-colors cursor-pointer"
              title="Настройки карты"
            >
              ⚙ Карта
            </button>

            <button
              onClick={() => setCreateOpen(true)}
              className="px-4 py-2 bg-blood text-paper
                         type text-[11px] uppercase tracking-[0.22em]
                         hover:bg-blood-hover transition-colors cursor-pointer"
            >
              + Локация
            </button>
          </div>
        </div>

        {linkSource && (
          <div className="mb-3 px-4 py-2 border border-blood/40 bg-blood/10
                          flex items-center justify-between gap-4 flex-wrap">
            <div className="type text-[11px] uppercase tracking-[0.22em] text-blood">
              Выберите вторую локацию для связи с «{linkSourceLoc?.name}»
            </div>
            <button
              onClick={cancelLink}
              className="type text-[10px] uppercase tracking-[0.22em]
                         text-bone-muted hover:text-bone transition-colors cursor-pointer"
            >
              Esc — отмена
            </button>
          </div>
        )}

        <div className="flex gap-3 items-start">
          <div className="flex-1 min-w-0">
            <div
              className="relative w-full border border-brass/30 bg-ink-soft overflow-hidden"
              style={{ height: 'calc(100vh - 260px)', minHeight: 400 }}
            >
              <MapPanContainer
                width={mapSize.width}
                height={mapSize.height}
                disabled={false}
                zoom={zoom}
                onZoomChange={setZoom}
                contentRef={contentRef}
                fitMinZoomToViewport
                fitMinZoomMode="cover"
                className="w-full h-full"
              >
                {mapBgUrl && (
                  <img
                    src={mapBgUrl}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 w-full h-full
                               pointer-events-none select-none"
                  />
                )}

                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    opacity: mapBgUrl ? 0.15 : 0.5,
                    backgroundImage:
                      'linear-gradient(rgba(201,162,74,0.2) 1px, transparent 1px),' +
                      'linear-gradient(90deg, rgba(201,162,74,0.2) 1px, transparent 1px)',
                    backgroundSize: '80px 80px',
                  }}
                />

                <svg
                  className="absolute inset-0 pointer-events-none"
                  width={mapSize.width}
                  height={mapSize.height}
                  style={{ zIndex: 10 }}
                >
                  <g style={{ pointerEvents: 'auto' }}>
                    {visibleConnections.map((c) => {
                      const from = getLocation(c.fromLocationId);
                      const to = getLocation(c.toLocationId);
                      if (!from || !to) return null;
                      return (
                        <ConnectionLine
                          key={c.id}
                          fromX={from.mapX}
                          fromY={from.mapY}
                          toX={to.mapX}
                          toY={to.mapY}
                          label={c.label}
                          bidirectional={isBidirectional(
                            c.fromLocationId,
                            c.toLocationId
                          )}
                          selected={
                            selected === c.fromLocationId ||
                            selected === c.toLocationId
                          }
                          onClick={() => handleDeleteConnection(c.id)}
                        />
                      );
                    })}
                  </g>
                </svg>

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
                  {sortedLocations.map((l) => (
                    <LocationNode
                      key={l.id}
                      location={l}
                      selected={selected === l.id}
                      hovered={hoveredId === l.id}
                      onSelect={handleNodeSelect}
                      onHover={setHoveredId}
                      onTransformEnd={handleNodeTransform}
                      onSizeResolved={handleNodeSize}
                      obstacles={mapObstacles}
                      zoom={zoom}
                      linkSource={linkSource === l.id}
                      pickTarget={!!linkSource && linkSource !== l.id}
                      bounds={mapSize}
                    />
                  ))}
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
                  {selectedLoc ? 'Локация' : 'Как работать'}
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

              {!selectedLoc ? (
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
                      <li>• Тащи карточки мышкой — сохраняется автоматически.</li>
                      <li>• Угловые ручки — пропорциональный ресайз.</li>
                      <li>• Кружок сверху — поворот.</li>
                      <li>• Карточки не проходят сквозь друг друга.</li>
                      <li>• Клик по пустому месту — снять выделение.</li>
                      <li>
                        • <strong className="text-brass">🔗 Связать с…</strong> — во
                        вкладке выделенной локации.
                      </li>
                      <li>• Клик по линии — удалить связь.</li>
                      <li>• Зум — колесо, ± или щипок.</li>
                      <li>• Только корневые локации. Под-локации — внутри сцены родителя.</li>
                    </ul>
                  )}
                </>
              ) : (
                <>
                  <h3 className="font-poster text-lg text-bone leading-tight mb-1">
                    {selectedLoc.name}
                  </h3>
                  <div className="type text-[10px] uppercase tracking-[0.22em]
                                  text-bone-muted mb-3">
                    {selectedLoc.locationType}
                  </div>

                  <div className="flex flex-col gap-1.5 mb-4 text-bone text-[12px]">
                    <Row label="X" value={String(Math.round(selectedLoc.mapX))} />
                    <Row label="Y" value={String(Math.round(selectedLoc.mapY))} />
                    <Row
                      label="Scale"
                      value={`${(selectedLoc.sceneScale ?? 1).toFixed(2)}×`}
                    />
                    <Row
                      label="Поворот"
                      value={`${Math.round(selectedLoc.sceneRotation ?? 0)}°`}
                    />
                  </div>

                  <div className="pt-3 border-t border-brass/20 mb-4">
                    <div className="type text-[10px] uppercase tracking-[0.3em]
                                    text-brass mb-3">
                      Связи · {selectedOutgoing.length + selectedIncoming.length}
                    </div>

                    {selectedOutgoing.length === 0 &&
                      selectedIncoming.length === 0 && (
                        <p className="type text-[11px] text-bone-muted italic mb-3">
                          Нет связей.
                        </p>
                      )}

                    {selectedOutgoing.length > 0 && (
                      <div className="mb-3">
                        <div className="type text-[10px] uppercase tracking-[0.24em]
                                        text-bone-muted mb-1.5">
                          → отсюда
                        </div>
                        <ul className="space-y-1">
                          {selectedOutgoing.map((c) => {
                            const target = getLocation(c.toLocationId);
                            return (
                              <li
                                key={c.id}
                                className="flex items-center gap-2
                                           bg-ink-card border border-brass/20
                                           px-2.5 py-1.5"
                              >
                                <span className="flex-1 text-bone text-[12px] truncate">
                                  {target?.name ?? '—'}
                                  {c.label && (
                                    <span className="text-bone-dim"> · {c.label}</span>
                                  )}
                                </span>
                                <button
                                  onClick={() => handleDeleteConnection(c.id)}
                                  className="w-6 h-6 flex items-center justify-center
                                             text-blood hover:text-blood-hover
                                             type text-[11px] cursor-pointer"
                                  title="Удалить"
                                >
                                  ✕
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {selectedIncoming.length > 0 && (
                      <div className="mb-3">
                        <div className="type text-[10px] uppercase tracking-[0.24em]
                                        text-bone-muted mb-1.5">
                          ← сюда
                        </div>
                        <ul className="space-y-1">
                          {selectedIncoming.map((c) => {
                            const source = getLocation(c.fromLocationId);
                            return (
                              <li
                                key={c.id}
                                className="flex items-center gap-2
                                           bg-ink-card border border-brass/20
                                           px-2.5 py-1.5"
                              >
                                <span className="flex-1 text-bone text-[12px] truncate">
                                  {source?.name ?? '—'}
                                </span>
                                <button
                                  onClick={() => handleDeleteConnection(c.id)}
                                  className="w-6 h-6 flex items-center justify-center
                                             text-blood hover:text-blood-hover
                                             type text-[11px] cursor-pointer"
                                  title="Удалить"
                                >
                                  ✕
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={() => startLinkFrom(selectedLoc.id)}
                      className="w-full mt-2 px-3 py-2 border border-brass/50
                                 bg-brass/10 text-brass
                                 type text-[11px] uppercase tracking-[0.24em]
                                 hover:bg-brass/20 transition-colors cursor-pointer"
                    >
                      🔗 Связать с…
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-brass/20">
                    <Link
                      to={`/admin/cases/${caseId}/scene/${selectedLoc.id}`}
                      className="px-3 py-2 bg-brass/20 text-brass border border-brass/50
                                 type text-[11px] uppercase tracking-[0.24em]
                                 hover:bg-brass/30 transition-colors text-center"
                    >
                      🎨 Открыть сцену
                    </Link>

                    <button
                      onClick={() => setEditLocationId(selectedLoc.id)}
                      className="px-3 py-2 border border-brass/40 text-brass
                                 type text-[11px] uppercase tracking-[0.24em]
                                 hover:bg-brass/10 transition-colors cursor-pointer"
                    >
                      ✎ Изменить локацию
                    </button>

                    <button
                      onClick={handleDeleteClick}
                      className="px-3 py-2 border border-blood/40 text-blood
                                 type text-[11px] uppercase tracking-[0.24em]
                                 hover:bg-blood/10 transition-colors cursor-pointer"
                    >
                      ✕ Удалить локацию
                    </button>

                    <button
                      onClick={() => setSelected(null)}
                      className="px-3 py-2 border border-bone/15 text-bone-dim
                                 type text-[11px] uppercase tracking-[0.24em]
                                 hover:text-bone-muted transition-colors cursor-pointer"
                    >
                      Снять выделение
                    </button>
                  </div>
                </>
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

      {settingsOpen && (
        <MapSettingsModal
          caseData={caseData}
          locations={rootLocations}
          onSave={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {createOpen && (
        <LocationModal
          caseId={caseId}
          locations={rootLocations}
          evidences={evidences}
          characters={characters}
          onSave={handleCreateLocation}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {editTarget && (
        <LocationModal
          caseId={caseId}
          locations={rootLocations}
          evidences={evidences}
          characters={characters}
          initial={editTarget}
          onSave={handleEditLocation}
          onClose={() => setEditLocationId(null)}
        />
      )}

      {deleteTarget && (
        <DeleteLocationModal
          info={deleteTarget}
          onConfirm={confirmDelete}
          onClose={() => !isDeleting && setDeleteTarget(null)}
          busy={isDeleting}
        />
      )}

      {linkSourceLoc && linkTargetLoc && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4
                     bg-ink/85 backdrop-blur-sm"
          onClick={() => !isCreatingLink && cancelLink()}
        >
          <div
            className="relative max-w-lg w-full border-2 border-brass/50 bg-ink/95 p-6"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow:
                'inset 0 1px 0 rgba(201,162,74,0.2), 0 24px 60px rgba(0,0,0,0.9)',
            }}
          >
            <div className="type text-[11px] uppercase tracking-[0.3em] text-brass mb-4">
              Новая связь
            </div>

            <div className="flex items-center gap-3 mb-5 text-bone flex-wrap">
              <span
                className="px-3 py-1.5 bg-blood/20 border border-blood/50 text-bone
                           type text-[11px] uppercase tracking-[0.2em]"
              >
                A · {linkSourceLoc.name}
              </span>
              <span className="text-brass text-lg">→</span>
              <span
                className="px-3 py-1.5 bg-green-700/20 border border-green-600/50 text-bone
                           type text-[11px] uppercase tracking-[0.2em]"
              >
                B · {linkTargetLoc.name}
              </span>
            </div>

            <label className="flex flex-col gap-2 mb-4">
              <span className="type text-[10px] uppercase tracking-[0.24em] text-bone-muted">
                Метка (необязательно)
              </span>
              <input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="В лес, Выйти на улицу…"
                maxLength={200}
                autoFocus
                className="bg-ink-soft border border-ink-line text-bone px-3 py-2
                           placeholder:text-bone-dim/60 focus:outline-none focus:border-blood
                           font-type text-[13px]"
              />
            </label>

            {linkError && (
              <div className="mb-4 px-3 py-2 bg-blood/15 border-l-4 border-blood
                              type text-[12px] text-blood">
                {linkError}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={cancelLink}
                disabled={isCreatingLink}
                className="px-4 py-2 border border-bone/25 text-bone-muted
                           type text-[11px] uppercase tracking-[0.24em]
                           hover:text-bone hover:border-bone/60
                           transition-colors cursor-pointer disabled:opacity-40"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateLink}
                disabled={isCreatingLink}
                className="bg-blood text-paper px-4 py-2
                           type text-[11px] uppercase tracking-[0.24em]
                           hover:bg-blood-hover transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isCreatingLink ? 'Создаём…' : 'Создать связь'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
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