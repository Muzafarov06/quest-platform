import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getSession,
  getSessionPlayers,
  joinSession,
  leaveSession,
  closeSession,
  moveInLobby,
} from '../api/sessions';
import { getCase } from '../api/cases';
import { getPlayerScene, getPlayerMap } from '../api/scene';
import { getLocation } from '../api/locations';
import { sendSessionAction } from '../api/actions';
import { inspectObject } from '../api/inspect';
import { getMyInventory } from '../api/inventory';
import { getEvidence } from '../api/evidences';
import {
  getSessionFinalQuestion,
  submitFinalAnswer,
  startFinalAnswer,
} from '../api/finalQuestion';
import {
  MapPanContainer,
  type MapPanContainerHandle,
} from '../components/admin/map/MapPanContainer';
import { computePinSize } from '../components/admin/scene/ScenePin';
import { CharacterModal } from '../components/CharacterModal';
import { EventModalList } from '../components/EventModalList';
import { RealtimeToasts } from '../components/RealtimeToasts';
import { FigureImage } from '../components/FigureImage';
import { VoicePanel } from '../components/VoicePanel';
import { SessionIntroOverlay } from '../components/session/SessionIntroOverlay';
import { GameMenu } from '../components/session/GameMenu';
import { BottomActionBar } from '../components/session/BottomActionBar';
import { Portfolio } from '../components/session/Portfolio';
import {
  PlayerMapView,
  LocationPreview,
  type PreviewLocation,
} from '../components/session/PlayerMapView';
import { ObjectInspectModal } from '../components/session/ObjectInspectModal';
import {
  DispatchPanel,
  gameEventToDispatch,
  type DispatchMessage,
} from '../components/session/DispatchPanel';
import { CallToInterrogationModal } from '../components/session/CallToInterrogationModal';
import { useSessionSocket } from '../hooks/useSessionSocket';
import { useMediaUrl } from '../hooks/useMediaUrl';
import { useImageSize } from '../hooks/useImageSize';
import { useSceneMovement } from '../hooks/useSceneMovement';
import { useAuth } from '../auth/useAuth';
import {
  computePinZ,
  resolvePinLayer,
  LAYER_ME,
  LAYER_PLAYER,
} from '../utils/sceneLayers';
import type { GameObjectType, GameObjectRenderLayer } from '../types/object';
import type { GameSession, SessionPlayer, Facing } from '../types/session';
import type { Case } from '../types/case';
import type { PlayerScene, PlayerMap } from '../types/scene';
import type { Location } from '../types/location';
import type { Character } from '../types/character';
import type { Evidence } from '../types/evidence';
import type { GameEvent } from '../types/action';
import type { FinalQuestion } from '../types/finalQuestion';
import type { SessionSocketEvent } from '../types/socket';
import type { IdentifiedBounds } from '../utils/collision';
import type { ApiErrorResponse } from '../types/api';
import type { ObjectInspectResponse } from '../types/inspect';

const SCENE_FALLBACK_W = 1200;
const SCENE_FALLBACK_H = 800;

const INTERACTION_RADIUS_PCT = 6;
const CHARACTER_TALK_RADIUS_PCT = 8;

interface CollisionInset {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const SCENE_OBJECT_COLLISION: CollisionInset = {
  left: 0.15, right: 0.15, top: 0.15, bottom: 0.15,
};

const SCENE_CHARACTER_COLLISION: CollisionInset = {
  left: 0.15, right: 0.15, top: 0.15, bottom: 0.15,
};

const SCENE_SUBLOCATION_COLLISION: CollisionInset = {
  left: 0.15, right: 0.15, top: 0.15, bottom: 0.15,
};

const BASE_SIZE = {
  object: 90,
  character: 100,
  sublocation: 120,
  exit: 56,
} as const;

const INTRO_KEY = 'quest.intro.dismissed';

type ViewMode = 'map' | 'location';

interface SceneSize {
  width: number;
  height: number;
}

interface ParentBack {
  id: string;
  name: string;
}

interface RemotePosition {
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  facing: Facing;
}

export function SessionPlayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<GameSession | null>(null);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [introDismissed, setIntroDismissed] = useState<boolean>(
    () => sessionStorage.getItem(`${INTRO_KEY}:${id}`) === '1'
  );

  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const [map, setMap] = useState<PlayerMap | null>(null);
  const [mapLoading, setMapLoading] = useState(false);

  const [scene, setScene] = useState<PlayerScene | null>(null);
  const [sceneLoading, setSceneLoading] = useState(false);

  const [parentBack, setParentBack] = useState<ParentBack | null>(null);
  const [subPreview, setSubPreview] = useState<Location | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [dispatchMessages, setDispatchMessages] = useState<DispatchMessage[]>([]);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [openCharacter, setOpenCharacter] = useState<Character | null>(null);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [nearbyCharacterId, setNearbyCharacterId] = useState<string | null>(null);
  const [dismissedCharacterId, setDismissedCharacterId] = useState<string | null>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [inventoryEvidences, setInventoryEvidences] = useState<Evidence[]>([]);
  const [finalQuestion, setFinalQuestion] = useState<FinalQuestion | null>(null);
  const [finalModalOpen, setFinalModalOpen] = useState(false);
  const [finalAnswerText, setFinalAnswerText] = useState('');
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [finalError, setFinalError] = useState<string | null>(null);

  /**
   * Владелец нажал «Дать финальный ответ» — пришло WS-событие
   * FINAL_ANSWER_STARTED. Значит, модалка открыта не мной.
   */
  const [finalAnswerStartedByOther, setFinalAnswerStartedByOther] = useState(false);
  /** Имя владельца, который пишет финал. */
  const [finalAnswerOwnerName, setFinalAnswerOwnerName] = useState<string | null>(null);

  const [inspectData, setInspectData] = useState<ObjectInspectResponse | null>(null);
  const [proximityHint, setProximityHint] = useState<string | null>(null);

  const [closedModal, setClosedModal] = useState<{ reason: string | null } | null>(null);

  const [lastSocketEvent, setLastSocketEvent] = useState<SessionSocketEvent | null>(null);

  const [remoteLocations, setRemoteLocations] = useState<Map<string, string | null>>(
    new Map()
  );
  const remotePositionsRef = useRef<Map<string, RemotePosition>>(new Map());

  const [pinSizes, setPinSizes] = useState<
    Map<string, { w: number; h: number }>
  >(new Map());

  const scenePositionRef = useRef<{ x: number; y: number; facing: Facing }>({
    x: 50, y: 70, facing: 'UP',
  });
  const mapRef = useRef<MapPanContainerHandle>(null);
  const [mapZoom, setMapZoom] = useState(1);

  const currentLocationIdRef = useRef<string | null>(null);
  const focusedMapRef = useRef(false);

  const mapBgUrlForSize = useMediaUrl(map?.mapMediaId ?? null);
  const naturalMapSize = useImageSize(mapBgUrlForSize);

  const mapEffective: PlayerMap | null = useMemo(() => {
    if (!map) return null;
    const w = naturalMapSize && naturalMapSize.width > 100
      ? naturalMapSize.width
      : map.mapWidth;
    const h = naturalMapSize && naturalMapSize.height > 100
      ? naturalMapSize.height
      : map.mapHeight;
    return { ...map, mapWidth: w, mapHeight: h };
  }, [map, naturalMapSize]);

  const sceneBgUrl = useMediaUrl(scene?.location.mediaId ?? null);
  const sceneNaturalSize = useImageSize(sceneBgUrl);
  const sceneSize: SceneSize = useMemo(() => {
    if (sceneNaturalSize && sceneNaturalSize.width > 100 && sceneNaturalSize.height > 100) {
      return { width: sceneNaturalSize.width, height: sceneNaturalSize.height };
    }
    return { width: SCENE_FALLBACK_W, height: SCENE_FALLBACK_H };
  }, [sceneNaturalSize]);

  const me = players.find((p) => p.userId === user?.id) ?? null;
  const meId = me?.id ?? null;
  const meActive = !!me && me.active;
  const isOwner = user?.id === session?.ownerUserId;

  useEffect(() => {
    currentLocationIdRef.current = currentLocationId;
  }, [currentLocationId]);

  const syncRemoteFromPlayers = useCallback(
    (list: SessionPlayer[]) => {
      const positions = remotePositionsRef.current;
      const locs = new Map<string, string | null>();
      const activeIds = new Set<string>();

      for (const p of list) {
        if (!p.active) continue;
        if (meId && p.id === meId) continue;

        activeIds.add(p.id);

        const existing = positions.get(p.id);
        if (existing) {
          existing.targetX = p.posX;
          existing.targetY = p.posY;
          existing.facing = p.facing;
        } else {
          positions.set(p.id, {
            currentX: p.posX,
            currentY: p.posY,
            targetX: p.posX,
            targetY: p.posY,
            facing: p.facing,
          });
        }

        locs.set(p.id, p.currentLocationId);
      }

      for (const pid of Array.from(positions.keys())) {
        if (!activeIds.has(pid)) positions.delete(pid);
      }

      setRemoteLocations(locs);
    },
    [meId]
  );

  useEffect(() => {
    if (!players.length) return;
    syncRemoteFromPlayers(players);
  }, [players, syncRemoteFromPlayers]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    Promise.all([getSession(id), getSessionPlayers(id)])
      .then(async ([s, p]) => {
        setSession(s);
        setPlayers(p);
        const caseInfo = await getCase(s.caseId).catch(() => null);
        if (caseInfo) setCaseData(caseInfo);
      })
      .catch((err: unknown) => {
        const apiError = err as { response?: { data?: ApiErrorResponse } };
        setError(apiError.response?.data?.message ?? 'Не удалось загрузить сессию.');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !session || !user) return;
    if (!players.length) return;

    const currentMe = players.find((p) => p.userId === user.id);
    if (currentMe && currentMe.active) return;

    joinSession(session.roomCode, { displayName: user.displayName })
      .then(() => getSessionPlayers(id))
      .then(setPlayers)
      .catch(() => {});
  }, [id, session, user, players]);

  useEffect(() => {
    if (!id || !session) return;
    if (viewMode !== 'map') return;

    setMapLoading(true);
    getPlayerMap(id)
      .then((m) => setMap(m))
      .catch(() => setMap(null))
      .finally(() => setMapLoading(false));
  }, [id, session, viewMode]);

  useEffect(() => {
    if (viewMode === 'location') {
      focusedMapRef.current = false;
      return;
    }
    if (viewMode !== 'map') return;
    if (mapLoading || !mapEffective) return;
    if (focusedMapRef.current) return;

    const entryId = mapEffective.entryLocationId;
    if (!entryId) return;
    const entry = mapEffective.locations.find((l) => l.id === entryId);
    if (!entry) return;

    const t = window.setTimeout(() => {
      if (!mapRef.current) return;
      const cx = entry.mapX + 100;
      const cy = entry.mapY + 50;
      mapRef.current.focusOn(cx, cy, 1);
      focusedMapRef.current = true;
    }, 250);

    return () => window.clearTimeout(t);
  }, [viewMode, mapEffective, mapLoading]);

  useEffect(() => {
    if (!id || viewMode !== 'location' || !currentLocationId) return;
    setSceneLoading(true);
    getPlayerScene(id, currentLocationId)
      .then((sc) => {
        setScene(sc);
        scenePositionRef.current = {
          x: sc.location.entryX ?? 50,
          y: sc.location.entryY ?? 85,
          facing: 'UP',
        };
      })
      .catch(() => setScene(null))
      .finally(() => setSceneLoading(false));
  }, [id, viewMode, currentLocationId]);

  useEffect(() => {
    if (!id || viewMode !== 'location' || !scene) return;
    const entryX = scene.location.entryX ?? 50;
    const entryY = scene.location.entryY ?? 85;
    moveInLobby(id, entryX, entryY, 'UP', scene.location.id).catch(() => {});
  }, [id, viewMode, scene?.location.id]);

  useEffect(() => {
    const parentId = scene?.location.parentId;
    if (!parentId) {
      setParentBack(null);
      return;
    }
    let cancelled = false;
    getLocation(parentId)
      .then((loc) => {
        if (!cancelled) setParentBack({ id: loc.id, name: loc.name });
      })
      .catch(() => {
        if (!cancelled) setParentBack(null);
      });
    return () => { cancelled = true; };
  }, [scene?.location.parentId]);

  useEffect(() => {
    if (!id) return;
    getSessionFinalQuestion(id)
      .then(setFinalQuestion)
      .catch(() => setFinalQuestion(null));
  }, [id]);

  const loadInventory = useCallback(async () => {
    if (!id) return;
    try {
      const items = await getMyInventory(id);
      const evidences = await Promise.all(
        items.map((i) => getEvidence(i.evidenceId).catch(() => null))
      );
      setInventoryEvidences(evidences.filter((e): e is Evidence => e !== null));
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void loadInventory();
  }, [id, loadInventory]);

  const handlePinSize = useCallback(
    (pinId: string, size: { w: number; h: number }) => {
      setPinSizes((prev) => {
        const cur = prev.get(pinId);
        if (cur && cur.w === size.w && cur.h === size.h) return prev;
        const next = new Map(prev);
        next.set(pinId, size);
        return next;
      });
    },
    []
  );

  const obstacles: IdentifiedBounds[] = useMemo(() => {
    if (viewMode !== 'location' || !scene) return [];
    const result: IdentifiedBounds[] = [];

    const W = sceneSize.width;
    const H = sceneSize.height;

    const fallback = (variant: keyof typeof BASE_SIZE) => ({
      w: BASE_SIZE[variant], h: BASE_SIZE[variant],
    });

    scene.objects.forEach((o) => {
      if (o.walkable) return;
      const size = pinSizes.get(`obj-${o.id}`) ?? fallback('object');
      const fullWPct = (size.w / W) * 100;
      const fullHPct = (size.h / H) * 100;
      const box = computeAABB(o.posX, o.posY, fullWPct, fullHPct, SCENE_OBJECT_COLLISION, true);
      result.push({ id: `obj-${o.id}`, x: box.cx, y: box.cy, halfW: box.halfW, halfH: box.halfH });
    });

    scene.characters.forEach((c) => {
      const size = pinSizes.get(`char-${c.id}`) ?? fallback('character');
      const fullWPct = (size.w / W) * 100;
      const fullHPct = (size.h / H) * 100;
      const box = computeAABB(c.posX, c.posY, fullWPct, fullHPct, SCENE_CHARACTER_COLLISION, true);
      result.push({ id: `char-${c.id}`, x: box.cx, y: box.cy, halfW: box.halfW, halfH: box.halfH });
    });

    scene.subLocations.forEach((sub) => {
      const size = pinSizes.get(`sub-${sub.id}`) ?? fallback('sublocation');
      const fullWPct = (size.w / W) * 100;
      const fullHPct = (size.h / H) * 100;
      const box = computeAABB(sub.entryX ?? 50, sub.entryY ?? 50, fullWPct, fullHPct, SCENE_SUBLOCATION_COLLISION, true);
      result.push({ id: `sub-${sub.id}`, x: box.cx, y: box.cy, halfW: box.halfW, halfH: box.halfH });
    });

    return result;
  }, [viewMode, scene, sceneSize, pinSizes]);

  useSceneMovement({
    sessionId: session?.id ?? null,
    enabled: !!session && introDismissed && meActive && viewMode === 'location',
    positionRef: scenePositionRef,
    obstacles,
    locationId: currentLocationId,
    onSend: (sid, x, y, facing, locId) => {
      moveInLobby(sid, x, y, facing, locId).catch(() => {});
    },
  });

  useEffect(() => {
    if (viewMode !== 'location' || !scene || !meActive) {
      setNearbyCharacterId(null);
      return;
    }

    const interval = window.setInterval(() => {
      const p = scenePositionRef.current;
      let found: string | null = null;
      for (const c of scene.characters) {
        const dx = p.x - c.posX;
        const dy = p.y - c.posY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CHARACTER_TALK_RADIUS_PCT) {
          found = c.id;
          break;
        }
      }
      setNearbyCharacterId((prev) => (prev === found ? prev : found));
    }, 250);

    return () => window.clearInterval(interval);
  }, [viewMode, scene, meActive]);

  useEffect(() => {
    if (!nearbyCharacterId) {
      setDismissedCharacterId(null);
    }
  }, [nearbyCharacterId]);

  useEffect(() => {
    if (!nearbyCharacterId) return;
    if (nearbyCharacterId === dismissedCharacterId) return;
    const ch = scene?.characters.find((c) => c.id === nearbyCharacterId);
    if (ch) setOpenCharacter(ch);
  }, [nearbyCharacterId, dismissedCharacterId, scene]);

  useSessionSocket(
    session?.id ?? null,
    (event) => {
      setLastSocketEvent(event);

      if (event.type === 'GAME_EVENT') {
        if (event.event.eventType === 'DISPATCH_CALL') {
          const msg = gameEventToDispatch(event.event);
          setDispatchMessages((prev) => [...prev, msg]);
        } else {
          setEvents((prev) => [...prev, event.event]);
        }
      }

      if (event.type === 'SESSION_FINISHED' && id) {
        navigate(`/sessions/${id}/result`);
      }

      if (event.type === 'SESSION_CLOSED') {
        setClosedModal({ reason: event.reason ?? null });
      }

      /* Владелец начал писать финал — открываем read-only модалку. */
      if (event.type === 'FINAL_ANSWER_STARTED') {
        setFinalAnswerStartedByOther(true);
        setFinalAnswerOwnerName(event.ownerName);
        setFinalModalOpen(true);
      }

      if (event.type === 'PLAYER_KICKED') {
        if (meId && event.playerId === meId) {
          alert('Вас исключили из сессии.');
          navigate('/my-sessions');
          return;
        }
        if (id) getSessionPlayers(id).then(setPlayers).catch(() => {});
      }

      if (event.type === 'LOCATION_UNLOCKED' && id) {
        getPlayerMap(id).then(setMap).catch(() => {});
        if (viewMode === 'location' && currentLocationId) {
          getPlayerScene(id, currentLocationId).then(setScene).catch(() => {});
        }
      }

      if (event.type === 'PLAYER_JOINED'
          || event.type === 'PLAYER_LEFT'
          || event.type === 'PLAYER_UPDATED') {
        if (id) getSessionPlayers(id).then(setPlayers).catch(() => {});
      }

      if (event.type === 'PLAYER_MOVED') {
        const map = remotePositionsRef.current;
        const existing = map.get(event.playerId);
        if (existing) {
          existing.targetX = event.x;
          existing.targetY = event.y;
          existing.facing = event.facing;
        } else {
          map.set(event.playerId, {
            currentX: event.x,
            currentY: event.y,
            targetX: event.x,
            targetY: event.y,
            facing: event.facing,
          });
        }

        const newLoc = event.locationId ?? null;
        setRemoteLocations((prev) => {
          const cur = prev.get(event.playerId);
          if (cur === newLoc) return prev;
          const next = new Map(prev);
          next.set(event.playerId, newLoc);
          return next;
        });
      }

      if (event.type === 'EVIDENCE_TAKEN') {
        void loadInventory();
      }
    },
    !!session
  );

  const handleEnterLocation = async (locationId: string) => {
    setSubPreview(null);
    setSelectedLocationId(null);
    setCurrentLocationId(locationId);
    setViewMode('location');

    if (!id) return;

    try {
      await moveInLobby(id, 50, 85, 'UP', locationId);
    } catch { /* ignore */ }

    try {
      await sendSessionAction(id, {
        actionType: 'LOCATION_VISITED',
        targetId: locationId,
      });
    } catch { /* ignore */ }
  };

  const handleBack = () => {
    setSubPreview(null);
    setSelectedLocationId(null);

    if (parentBack && scene?.location.parentId) {
      setCurrentLocationId(parentBack.id);
      setScene(null);
      if (id) {
        moveInLobby(id, 50, 85, 'UP', parentBack.id).catch(() => {});
      }
      return;
    }

    setViewMode('map');
    setCurrentLocationId(null);
    setScene(null);
    if (id) {
      moveInLobby(id, 50, 85, 'UP', null).catch(() => {});
    }
  };

  const handleObjectClick = async (objectId: string) => {
    if (!id || !scene) return;

    const obj = scene.objects.find((o) => o.id === objectId);
    if (!obj) return;

    const W = sceneSize.width;
    const H = sceneSize.height;

    const size = pinSizes.get(`obj-${obj.id}`) ?? { w: BASE_SIZE.object, h: BASE_SIZE.object };
    const halfWPct = (size.w / W) * 100 / 2;
    const halfHPct = (size.h / H) * 100 / 2;
    const halfDiagonal = Math.sqrt(halfWPct * halfWPct + halfHPct * halfHPct);
    const threshold = INTERACTION_RADIUS_PCT + halfDiagonal;

    const p = scenePositionRef.current;
    const dx = p.x - obj.posX;
    const dy = p.y - obj.posY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > threshold) {
      setProximityHint('Слишком далеко — подойдите ближе');
      window.setTimeout(() => setProximityHint(null), 2200);
      return;
    }

    if (obj.objectType === 'INTERROGATION_PHONE') {
      setCallModalOpen(true);
      return;
    }

    try {
      const res = await inspectObject(id, objectId);
      setInspectData(res);
      void loadInventory();
    } catch { /* ignore */ }
  };

  const handleCharacterClick = (character: Character) => {
    setOpenCharacter(character);
  };

  const handleCloseCharacter = () => {
    if (nearbyCharacterId) setDismissedCharacterId(nearbyCharacterId);
    setOpenCharacter(null);
  };

  const handleSubLocationClick = (locationId: string) => {
    if (!scene) return;
    const sub = scene.subLocations.find((l) => l.id === locationId);
    if (!sub) return;
    setSubPreview(sub);
  };

  const handleSubPreviewEnter = () => {
    if (!subPreview) return;
    void handleEnterLocation(subPreview.id);
  };

  const handleSubPreviewBack = () => setSubPreview(null);

  const handleDismissIntro = () => {
    setIntroDismissed(true);
    if (id) sessionStorage.setItem(`${INTRO_KEY}:${id}`, '1');
  };

  const handleLeave = async () => {
    if (!id) return;
    if (!confirm('Покинуть сессию?')) return;
    try {
      await leaveSession(id);
      navigate('/my-sessions');
    } catch { alert('Не удалось покинуть сессию'); }
  };

  const handleCloseSession = async () => {
    if (!id) return;
    if (!confirm('Закрыть сессию для всех? Действие необратимо.')) return;
    try {
      await closeSession(id);
      navigate('/my-sessions');
    } catch { alert('Не удалось закрыть сессию'); }
  };

  /**
   * Владелец нажал «Дать финальный ответ».
   * Открываем модалку у себя и шлём WS-событие всем.
   */
  const handleStartFinalAnswer = async () => {
    if (!id || !isOwner) return;

    setFinalAnswerStartedByOther(false);
    setFinalAnswerOwnerName(user?.displayName ?? null);
    setFinalModalOpen(true);

    try {
      await startFinalAnswer(id);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      alert(apiError.response?.data?.message ?? 'Не удалось начать финал');
    }
  };

  const handleSubmitFinal = async () => {
    if (!id || !finalAnswerText.trim()) return;
    setIsSubmittingFinal(true);
    setFinalError(null);
    try {
      await submitFinalAnswer(id, finalAnswerText.trim());
      setTimeout(() => {
        if (window.location.pathname.includes('/play')) {
          navigate(`/sessions/${id}/result`);
        }
      }, 1200);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setFinalError(apiError.response?.data?.message ?? 'Не удалось отправить ответ');
      setIsSubmittingFinal(false);
    }
  };

  const markDispatchRead = () => {
    setDispatchMessages((prev) => prev.map((m) => ({ ...m, read: true })));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-ink flex items-center justify-center">
        <span className="type text-[13px] uppercase tracking-[0.32em] text-bone-muted">
          Открываем дело…
        </span>
      </div>
    );
  }

  if (error || !session || !caseData) {
    return (
      <div className="fixed inset-0 bg-ink flex items-center justify-center p-6">
        <div className="paper paper-fresh p-8 max-w-lg border-l-4 border-blood">
          <div className="type text-[11px] uppercase tracking-[0.28em] text-blood mb-3">Ошибка</div>
          <div className="text-ink-text text-base mb-6">{error ?? 'Сессия недоступна.'}</div>
          <button
            onClick={() => navigate('/my-sessions')}
            className="type text-[12px] uppercase tracking-[0.24em] text-blood hover:text-blood-hover cursor-pointer"
          >
            ← Мои сессии
          </button>
        </div>
      </div>
    );
  }

  const dispatchUnreadCount = dispatchMessages.filter((m) => !m.read).length;

  const backLabel = parentBack && scene?.location.parentId
    ? `← Вернуться в ${parentBack.name}`
    : '← К карте';

  /* Модалка показывается и owner'у, и остальным. У non-owner — read-only. */
  const showFinalModal = finalModalOpen && finalQuestion;

  return (
    <div className="fixed inset-0 bg-ink overflow-hidden">
      {viewMode === 'map' ? (
        mapLoading || !mapEffective ? (
          <LoadingScreen label="Открываем карту…" />
        ) : (
          <div className="absolute inset-0">
            <MapPanContainer
              ref={mapRef}
              width={mapEffective.mapWidth}
              height={mapEffective.mapHeight}
              disabled={false}
              zoom={mapZoom}
              onZoomChange={setMapZoom}
              fitMinZoomToViewport
              fitMinZoomMode="cover"
              className="w-full h-full"
            >
              <PlayerMapView
                map={mapEffective}
                selectedLocationId={selectedLocationId}
                onSelectLocation={setSelectedLocationId}
                onEnterLocation={handleEnterLocation}
              />
            </MapPanContainer>
          </div>
        )
      ) : (
        <LocationViewport
          scene={scene}
          sceneSize={sceneSize}
          loading={sceneLoading}
          players={players}
          meId={meId}
          remoteLocations={remoteLocations}
          remotePositionsRef={remotePositionsRef}
          positionRef={scenePositionRef}
          onObjectClick={handleObjectClick}
          onCharacterClick={handleCharacterClick}
          onSubLocationClick={handleSubLocationClick}
          onExitClick={handleEnterLocation}
          onBack={handleBack}
          backLabel={backLabel}
          onPinSize={handlePinSize}
        />
      )}

      {subPreview && (
        <LocationPreview
          location={subPreview as PreviewLocation}
          onBack={handleSubPreviewBack}
          onEnter={handleSubPreviewEnter}
        />
      )}

      <BottomActionBar
        sessionId={session.id}
        inventoryCount={inventoryEvidences.length}
        menuOpen={menuOpen}
        onOpenInventory={() => setInventoryOpen(true)}
        onToggleMenu={() => setMenuOpen((v) => !v)}
        onOpenDispatch={() => setDispatchOpen(true)}
        dispatchUnreadCount={dispatchUnreadCount}
      />

      <DispatchPanel
        open={dispatchOpen}
        messages={dispatchMessages}
        onClose={() => setDispatchOpen(false)}
        onMarkAllRead={markDispatchRead}
      />

      <GameMenu
        open={menuOpen}
        onToggle={() => setMenuOpen((v) => !v)}
        sessionId={session.id}
        roomCode={session.roomCode}
        players={players}
        mePlayerId={meId}
        isOwner={isOwner}
        caseTitle={caseData.title}
        caseCode={caseData.code}
        onLeave={handleLeave}
        onCloseSession={handleCloseSession}
        onStartFinalAnswer={handleStartFinalAnswer}
        onOpenVoice={() => setVoiceOpen(true)}
        hasFinalQuestion={!!finalQuestion && session.status === 'ACTIVE'}
        onKicked={() => {
          if (id) getSessionPlayers(id).then(setPlayers).catch(() => {});
        }}
      />

      {inventoryOpen && (
        <Portfolio
          sessionId={session.id}
          evidences={inventoryEvidences}
          onClose={() => setInventoryOpen(false)}
        />
      )}

      {voiceOpen && (
        <SimpleModal onClose={() => setVoiceOpen(false)} title="Голосовая связь">
          <VoicePanel sessionId={session.id} enabled={session.status === 'ACTIVE'} />
        </SimpleModal>
      )}

      {showFinalModal && (
        <SimpleModal
          onClose={() => {
            if (isSubmittingFinal) return;
            /* Owner может закрыть — вернётся через меню. Non-owner — тоже. */
            setFinalModalOpen(false);
          }}
          title={isOwner ? 'Финальная версия' : 'Финальный ответ'}
        >
          <div
            className="text-bone text-[15px] leading-relaxed whitespace-pre-line mb-5"
            style={{ fontFamily: 'var(--font-type, monospace)' }}
          >
            {finalQuestion!.questionText}
          </div>

          {isOwner ? (
            /* ─── OWNER: пишет ответ ─── */
            <>
              <label className="flex flex-col gap-2 mb-5">
                <span className="type text-[10px] uppercase tracking-[0.24em] text-bone-muted">
                  Ваша версия
                </span>
                <textarea
                  value={finalAnswerText}
                  onChange={(e) => setFinalAnswerText(e.target.value)}
                  rows={10}
                  maxLength={30000}
                  disabled={isSubmittingFinal}
                  placeholder="Пишите как есть. Кто, зачем, как вы это поняли."
                  className="w-full bg-ink-soft border border-brass/40 text-bone
                             px-3 py-2 placeholder:text-bone-dim/60
                             focus:outline-none focus:border-blood
                             font-type text-[14px] leading-relaxed resize-y
                             disabled:opacity-60"
                />
              </label>

              {finalError && (
                <div className="mb-3 px-3 py-2 bg-blood/15 border-l-4 border-blood type text-[13px] text-blood">
                  {finalError}
                </div>
              )}

              <div className="px-3 py-2 bg-blood/10 border border-blood/30 text-blood/90 type text-[12px] mb-4">
                ⚠ После отправки расследование завершится. Ответить можно один раз.
              </div>

              <button
                onClick={handleSubmitFinal}
                disabled={!finalAnswerText.trim() || isSubmittingFinal}
                className="w-full bg-blood text-paper px-6 py-3
                           type text-[13px] uppercase tracking-[0.26em]
                           hover:bg-blood-hover transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmittingFinal ? 'Отправляем…' : 'Отправить и завершить'}
              </button>
            </>
          ) : (
            /* ─── NON-OWNER: читает, что владелец пишет ─── */
            <>
              <div className="flex items-center gap-4 mb-5 px-4 py-3
                              bg-brass/10 border-l-4 border-brass/70">
                <span className="shrink-0 text-3xl leading-none" aria-hidden="true">
                  ✍️
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="type text-[10px] uppercase tracking-[0.28em]
                                   text-bone-muted">
                    Финальный ответ составляет
                  </span>
                  <span className="font-poster text-[18px] text-bone mt-0.5">
                    {finalAnswerOwnerName ?? 'владелец команды'}
                  </span>
                </div>
              </div>

              <textarea
                value=""
                readOnly
                disabled
                placeholder="Владелец команды пишет финальную версию..."
                rows={8}
                className="w-full bg-ink-soft/50 border border-brass/25 text-bone-muted
                           px-3 py-2 placeholder:text-bone-dim/60
                           font-type text-[14px] leading-relaxed resize-none
                           cursor-not-allowed mb-4"
              />

              <div className="px-3 py-2 bg-brass/[0.08] border border-brass/30
                              type text-[12px] text-bone-muted mb-4">
                Только владелец может отправить финальный ответ. После отправки
                результат откроется у всех.
              </div>

              <button
                onClick={() => setFinalModalOpen(false)}
                className="w-full px-6 py-3 border border-brass/40 text-brass
                           type text-[13px] uppercase tracking-[0.26em]
                           hover:bg-brass/10 transition-colors cursor-pointer"
              >
                Свернуть
              </button>
            </>
          )}
        </SimpleModal>
      )}

      {callModalOpen && (
        <CallToInterrogationModal
          sessionId={session.id}
          onPick={(character) => {
            setCallModalOpen(false);
            setOpenCharacter(character);
          }}
          onClose={() => setCallModalOpen(false)}
        />
      )}

      {openCharacter && (
        <CharacterModal
          character={openCharacter}
          onClose={handleCloseCharacter}
        />
      )}

      {events.length > 0 && (
        <EventModalList
          events={events}
          sessionId={session.id}
          onAllClosed={() => setEvents([])}
          onEvidenceTaken={loadInventory}
        />
      )}

      {inspectData && (
        <ObjectInspectModal
          data={inspectData}
          onClose={() => setInspectData(null)}
        />
      )}

      {proximityHint && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[250]
                     px-5 py-3 bg-ink/95 border border-blood/60
                     type text-[12px] uppercase tracking-[0.24em] text-blood
                     animate-fade-in whitespace-nowrap"
          style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.8)' }}
        >
          {proximityHint}
        </div>
      )}

      {/* Плашка: владелец пишет финал (для non-owner, если модалку свернули). */}
      {finalAnswerStartedByOther && !finalModalOpen && !isOwner && (
        <button
          type="button"
          onClick={() => setFinalModalOpen(true)}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[250]
                     px-5 py-3 bg-brass/95 border border-brass text-ink
                     type text-[11px] uppercase tracking-[0.24em]
                     animate-fade-in whitespace-nowrap cursor-pointer
                     hover:bg-brass transition-colors"
          style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.9)' }}
        >
          ✍️ {finalAnswerOwnerName ?? 'Владелец'} пишет финал · открыть
        </button>
      )}

      {closedModal && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center
                     p-4 md:p-8 animate-fade-in"
          style={{ background: 'rgba(8,7,5,0.92)', backdropFilter: 'blur(6px)' }}
        >
          <div className="relative w-full max-w-lg">
            <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />
            <div className="pin brass" style={{ top: -8, right: 44, zIndex: 20 }} />

            <div className="paper paper-old p-8 md:p-10 relative">
              <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
                <span className="stamp-red text-xs">Закрыто</span>
              </div>

              <span className="kicker text-[11px]">Штаб · уведомление</span>

              <h2 className="mt-4 font-poster text-3xl md:text-4xl leading-[0.95]
                             text-texture-ink">
                Сессия закрыта
              </h2>

              <div className="mt-4 hand text-xl text-blood rotate-[-1.5deg]">
                владелец свернул расследование
              </div>

              <p className="mt-6 text-ink-text-soft text-[14px] leading-relaxed">
                {closedModal.reason
                  ? closedModal.reason
                  : 'Владелец комнаты завершил сессию для всех участников.'}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/my-sessions')}
                  className="flex-1 bg-blood text-paper px-6 py-3
                             type text-[12px] uppercase tracking-[0.26em]
                             hover:bg-blood-hover transition-colors cursor-pointer"
                >
                  К списку сессий →
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/cases')}
                  className="flex-1 px-6 py-3 border border-ink-text/40 text-ink-text
                             type text-[12px] uppercase tracking-[0.26em]
                             hover:border-ink-text/70 hover:bg-black/5
                             transition-colors cursor-pointer"
                >
                  В каталог дел
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <RealtimeToasts event={lastSocketEvent} />

      {!introDismissed && (
        <SessionIntroOverlay
          caseCode={caseData.code}
          caseTitle={caseData.title}
          caseDescription={caseData.description}
          playersCount={players.filter((p) => p.active).length}
          onDismiss={handleDismissIntro}
        />
      )}
    </div>
  );
}

/* ============================================================ */

function computeAABB(
  baseX: number,
  baseY: number,
  fullW: number,
  fullH: number,
  inset: CollisionInset,
  isCenter: boolean
): { cx: number; cy: number; halfW: number; halfH: number } {
  let left: number;
  let right: number;
  let top: number;
  let bottom: number;

  if (isCenter) {
    const halfW = fullW / 2;
    const halfH = fullH / 2;
    left = baseX - halfW + fullW * inset.left;
    right = baseX + halfW - fullW * inset.right;
    top = baseY - halfH + fullH * inset.top;
    bottom = baseY + halfH - fullH * inset.bottom;
  } else {
    left = baseX + fullW * inset.left;
    right = baseX + fullW - fullW * inset.right;
    top = baseY + fullH * inset.top;
    bottom = baseY + fullH - fullH * inset.bottom;
  }

  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const halfW = Math.max(0, (right - left) / 2);
  const halfH = Math.max(0, (bottom - top) / 2);

  return { cx, cy, halfW, halfH };
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink">
      <span className="type text-[13px] uppercase tracking-[0.32em] text-bone-muted">
        {label}
      </span>
    </div>
  );
}

/* ============================================================ */

function RemotePlayersLayer({
  players,
  meId,
  sceneLocationId,
  sceneSize,
  remoteLocations,
  remotePositionsRef,
}: {
  players: SessionPlayer[];
  meId: string | null;
  sceneLocationId: string;
  sceneSize: SceneSize;
  remoteLocations: Map<string, string | null>;
  remotePositionsRef: React.MutableRefObject<Map<string, RemotePosition>>;
}) {
  const domRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const visible = useMemo(
    () =>
      players.filter(
        (p) =>
          p.active &&
          p.id !== meId &&
          remoteLocations.get(p.id) === sceneLocationId
      ),
    [players, meId, sceneLocationId, remoteLocations]
  );

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const positions = remotePositionsRef.current;
      for (const [id, dom] of domRefs.current) {
        const pos = positions.get(id);
        if (!pos) continue;

        const dx = pos.targetX - pos.currentX;
        const dy = pos.targetY - pos.currentY;

        if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
          pos.currentX += dx * 0.3;
          pos.currentY += dy * 0.3;
        } else {
          pos.currentX = pos.targetX;
          pos.currentY = pos.targetY;
        }

        dom.style.left = `${pos.currentX}%`;
        dom.style.top = `${pos.currentY}%`;
        dom.style.zIndex = String(computePinZ(LAYER_PLAYER, pos.currentY));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [remotePositionsRef]);

  const base = BASE_SIZE.character;
  const w = (base / sceneSize.width) * 100;
  const h = (base / sceneSize.height) * 100;

  return (
    <>
      {visible.map((p) => {
        const pos = remotePositionsRef.current.get(p.id);
        const initX = pos ? pos.currentX : p.posX;
        const initY = pos ? pos.currentY : p.posY;
        return (
          <div
            key={p.id}
            ref={(el) => {
              if (el) domRefs.current.set(p.id, el);
              else domRefs.current.delete(p.id);
            }}
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: `${initX}%`,
              top: `${initY}%`,
              width: `${w}%`,
              height: `${h}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: computePinZ(LAYER_PLAYER, initY),
            }}
          >
            <div className="relative w-full h-full flex flex-col items-center justify-end">
              <span
                className="absolute -top-6 left-1/2 -translate-x-1/2
                           type text-[10px] uppercase tracking-[0.16em] px-2 py-0.5
                           whitespace-nowrap bg-ink/90 text-bone border border-bone/30"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
              >
                {p.displayName}
              </span>
              <FigureImage
                code={p.avatarKey}
                alt={p.displayName}
                className="w-full h-full object-contain
                           drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)]"
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ============================================================ */

function LocationViewport({
  scene,
  sceneSize,
  loading,
  players,
  meId,
  remoteLocations,
  remotePositionsRef,
  positionRef,
  onObjectClick,
  onCharacterClick,
  onSubLocationClick,
  onExitClick,
  onBack,
  backLabel,
  onPinSize,
}: {
  scene: PlayerScene | null;
  sceneSize: SceneSize;
  loading: boolean;
  players: SessionPlayer[];
  meId: string | null;
  remoteLocations: Map<string, string | null>;
  remotePositionsRef: React.MutableRefObject<Map<string, RemotePosition>>;
  positionRef: React.MutableRefObject<{ x: number; y: number; facing: Facing }>;
  onObjectClick: (id: string) => void;
  onCharacterClick: (c: Character) => void;
  onSubLocationClick: (id: string) => void;
  onExitClick: (id: string) => void;
  onBack: () => void;
  backLabel: string;
  onPinSize: (id: string, size: { w: number; h: number }) => void;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const bgUrl = useMediaUrl(scene?.location.mediaId ?? null);

  const mePlayer = players.find((p) => p.id === meId) ?? null;

  return (
    <div className="absolute inset-0">
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
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
          />
        ) : (
          <div className="absolute inset-0 bg-ink-soft" />
        )}

        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(201,162,74,0.2) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(201,162,74,0.2) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        <div className="absolute inset-0">
          {scene?.objects.map((o) => (
            <SceneStaticPin
              key={`obj-${o.id}`}
              pinId={`obj-${o.id}`}
              x={o.posX}
              y={o.posY}
              scale={o.sceneScale ?? 1}
              rotation={o.sceneRotation ?? 0}
              mediaId={o.mediaId}
              alt={o.name}
              baseSize={BASE_SIZE.object}
              sceneSize={sceneSize}
              variant="object"
              objectType={o.objectType}
              renderLayer={o.renderLayer}
              onSizeResolved={onPinSize}
              onClick={() => onObjectClick(o.id)}
            />
          ))}

          {scene?.subLocations.map((sub) => (
            <SceneStaticPin
              key={`sub-${sub.id}`}
              pinId={`sub-${sub.id}`}
              x={sub.entryX ?? 50}
              y={sub.entryY ?? 50}
              scale={sub.sceneScale ?? 1}
              rotation={sub.sceneRotation ?? 0}
              mediaId={sub.mapMediaId}
              alt={sub.name}
              baseSize={BASE_SIZE.sublocation}
              sceneSize={sceneSize}
              variant="sublocation"
              onSizeResolved={onPinSize}
              onClick={() => onSubLocationClick(sub.id)}
            />
          ))}

          {scene?.characters.map((c) => (
            <CharacterStaticPin
              key={`char-${c.id}`}
              characterId={c.id}
              x={c.posX}
              y={c.posY}
              scale={c.sceneScale ?? 1}
              rotation={c.sceneRotation ?? 0}
              mediaId={c.portraitMediaId}
              alt={c.name}
              baseSize={BASE_SIZE.character}
              sceneSize={sceneSize}
              onSizeResolved={onPinSize}
              onClick={() => onCharacterClick(c)}
            />
          ))}

          {scene?.connections
            .filter((c) => c.posX != null && c.posY != null)
            .map((c) => (
              <SceneStaticPin
                key={`exit-${c.id}`}
                pinId={`exit-${c.id}`}
                x={c.posX as number}
                y={c.posY as number}
                scale={1}
                rotation={0}
                mediaId={null}
                alt={c.label ?? 'Перейти'}
                baseSize={BASE_SIZE.exit}
                sceneSize={sceneSize}
                variant="exit"
                arrow
                onSizeResolved={onPinSize}
                onClick={() => onExitClick(c.toLocationId)}
              />
            ))}

          {scene && (
            <RemotePlayersLayer
              players={players}
              meId={meId}
              sceneLocationId={scene.location.id}
              sceneSize={sceneSize}
              remoteLocations={remoteLocations}
              remotePositionsRef={remotePositionsRef}
            />
          )}

          {mePlayer && (
            <MyScenePlayer
              mePlayer={mePlayer}
              positionRef={positionRef}
              sceneSize={sceneSize}
            />
          )}
        </div>
      </MapPanContainer>

      <button
        type="button"
        onClick={onBack}
        className="absolute top-3 left-3 z-[100]
                   px-4 py-2 bg-ink/90 border border-brass/50
                   type text-[11px] uppercase tracking-[0.24em] text-brass
                   hover:bg-brass/10 transition-colors cursor-pointer
                   whitespace-nowrap"
        style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.7)' }}
      >
        {backLabel}
      </button>

      {scene && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-[100]
                     px-5 py-2 bg-ink/90 border border-brass/50
                     type text-[12px] uppercase tracking-[0.28em] text-bone
                     whitespace-nowrap"
          style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.7)' }}
        >
          {scene.location.name}
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center
                        bg-ink/60 pointer-events-none z-[150]">
          <span className="type text-[13px] uppercase tracking-[0.32em] text-bone-muted">
            Открываем локацию…
          </span>
        </div>
      )}
    </div>
  );
}

/* ============================================================ */

function CharacterStaticPin({
  characterId,
  x,
  y,
  scale,
  rotation,
  mediaId,
  alt,
  baseSize,
  sceneSize,
  onSizeResolved,
  onClick,
}: {
  characterId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  mediaId: string | null | undefined;
  alt: string;
  baseSize: number;
  sceneSize: SceneSize;
  onSizeResolved: (id: string, size: { w: number; h: number }) => void;
  onClick: () => void;
}) {
  const url = useMediaUrl(mediaId);
  const natural = useImageSize(url);
  const { w: baseW, h: baseH } = computePinSize(baseSize, natural);

  const fullW = baseW * scale;
  const fullH = baseH * scale;

  useEffect(() => {
    onSizeResolved(`char-${characterId}`, { w: fullW, h: fullH });
  }, [characterId, fullW, fullH, onSizeResolved]);

  const wPct = (fullW / sceneSize.width) * 100;
  const hPct = (fullH / sceneSize.height) * 100;

  const zIndex = computePinZ(resolvePinLayer('character', undefined, undefined), y);

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={alt}
      className="absolute cursor-pointer"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${wPct}%`,
        height: `${hPct}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transformOrigin: 'center',
        zIndex,
      }}
    >
      {url ? (
        <img
          src={url}
          alt={alt}
          draggable={false}
          className="w-full h-full object-contain pointer-events-none select-none"
        />
      ) : (
        <img
          src="/images/logo.png"
          alt={alt}
          draggable={false}
          className="w-full h-full object-contain pointer-events-none select-none opacity-80"
        />
      )}
    </button>
  );
}

/* ============================================================ */

function MyScenePlayer({
  mePlayer,
  positionRef,
  sceneSize,
}: {
  mePlayer: SessionPlayer;
  positionRef: React.MutableRefObject<{ x: number; y: number; facing: Facing }>;
  sceneSize: SceneSize;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let raf = 0;
    let lastX = -1;
    let lastY = -1;
    const tick = () => {
      const el = elRef.current;
      if (el) {
        const p = positionRef.current;
        if (p.x !== lastX || p.y !== lastY) {
          lastX = p.x;
          lastY = p.y;
          el.style.left = `${p.x}%`;
          el.style.top = `${p.y}%`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [positionRef]);

  const p = positionRef.current;

  const base = BASE_SIZE.character;
  const w = (base / sceneSize.width) * 100;
  const h = (base / sceneSize.height) * 100;

  return (
    <div
      ref={elRef}
      className="absolute pointer-events-none will-change-transform"
      style={{
        left: `${p.x}%`,
        top: `${p.y}%`,
        width: `${w}%`,
        height: `${h}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: LAYER_ME,
      }}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-end">
        <span
          className="absolute -top-6 left-1/2 -translate-x-1/2
                     type text-[10px] uppercase tracking-[0.16em] px-2 py-0.5
                     whitespace-nowrap bg-blood text-paper"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
        >
          {mePlayer.displayName}
        </span>
        <FigureImage
          code={mePlayer.avatarKey}
          alt={mePlayer.displayName}
          className="w-full h-full object-contain
                     drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)]"
        />
      </div>
    </div>
  );
}

/* ============================================================ */

function SceneStaticPin({
  pinId,
  x,
  y,
  scale,
  rotation,
  mediaId,
  alt,
  baseSize,
  sceneSize,
  variant,
  objectType,
  renderLayer,
  arrow = false,
  onSizeResolved,
  onClick,
}: {
  pinId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  mediaId: string | null | undefined;
  alt: string;
  baseSize: number;
  sceneSize: SceneSize;
  variant: 'entry' | 'object' | 'character' | 'sublocation' | 'exit';
  objectType?: GameObjectType;
  renderLayer?: GameObjectRenderLayer;
  arrow?: boolean;
  onSizeResolved: (id: string, size: { w: number; h: number }) => void;
  onClick: () => void;
}) {
  const url = useMediaUrl(mediaId);
  const natural = useImageSize(arrow ? null : url);
  const { w: baseW, h: baseH } = computePinSize(baseSize, natural);

  const fullW = baseW * scale;
  const fullH = baseH * scale;

  useEffect(() => {
    onSizeResolved(pinId, { w: fullW, h: fullH });
  }, [pinId, fullW, fullH, onSizeResolved]);

  const wPct = (fullW / sceneSize.width) * 100;
  const hPct = (fullH / sceneSize.height) * 100;

  const layer = resolvePinLayer(variant, objectType, renderLayer);
  const zIndex = computePinZ(layer, y);

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={alt}
      className="absolute cursor-pointer"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${wPct}%`,
        height: `${hPct}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transformOrigin: 'center',
        zIndex,
      }}
    >
      {arrow ? (
        <div
          className="w-full h-full flex items-center justify-center
                     text-[26px] leading-none pointer-events-none select-none"
          style={{ color: '#ece2c9' }}
        >
          →
        </div>
      ) : (
        <SceneVisual mediaId={mediaId} alt={alt} />
      )}
    </button>
  );
}

function SceneVisual({
  mediaId,
  alt,
}: {
  mediaId: string | null | undefined;
  alt: string;
}) {
  const url = useMediaUrl(mediaId);

  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        draggable={false}
        className="w-full h-full object-contain pointer-events-none select-none"
      />
    );
  }

  return (
    <img
      src="/images/logo.png"
      alt={alt}
      draggable={false}
      className="w-full h-full object-contain pointer-events-none select-none opacity-80"
    />
  );
}

function SimpleModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] bg-ink/85 backdrop-blur-sm
                 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl border-2 border-brass/50
                   bg-ink/95 p-6 my-auto"
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
                     transition-colors cursor-pointer"
        >
          ✕
        </button>
        <div className="type text-[10px] uppercase tracking-[0.32em] text-brass
                        pb-3 mb-5 border-b border-brass/25">
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}