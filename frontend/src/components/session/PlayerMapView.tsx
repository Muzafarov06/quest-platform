import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import { useImageSize, type ImageSize } from '../../hooks/useImageSize';
import type { PlayerMap, PlayerMapLocation } from '../../types/scene';

/** Базовая ширина ноды (px). Высота подстраивается под пропорции PNG. */
const MAP_NODE_BASE_W = 200;

/** Высота-фолбэк, если PNG нет. */
const MAP_NODE_FALLBACK_H = 100;

/** Ограничения высоты, чтобы экстремальные пропорции не ломали карту. */
const MAP_NODE_MIN_H = 60;
const MAP_NODE_MAX_H = 320;

/** Насколько карточка увеличивается при наведении. */
const HOVER_SCALE = 1.06;

/**
 * Размер карточки локации на карте дела по натуральным пропорциям PNG.
 *
 * Полностью совпадает с логикой LocationNode (админка), чтобы позиции
 * нод на карте и в игре не разъезжались.
 */
function computeMapNodeSize(natural: ImageSize | null): { w: number; h: number } {
  if (!natural || natural.width <= 0 || natural.height <= 0) {
    return { w: MAP_NODE_BASE_W, h: MAP_NODE_FALLBACK_H };
  }
  const aspect = natural.width / natural.height;
  const w = MAP_NODE_BASE_W;
  let h = w / aspect;
  if (h < MAP_NODE_MIN_H) h = MAP_NODE_MIN_H;
  if (h > MAP_NODE_MAX_H) h = MAP_NODE_MAX_H;
  return { w, h: Math.round(h) };
}

/**
 * Минимальный тип для превью локации.
 *
 * Подходит и для PlayerMapLocation (карта дела), и для Location (под-локация
 * внутри сцены). LocationPreview работает с любым объектом, у которого есть
 * id, name и previewMediaId.
 */
export interface PreviewLocation {
  id: string;
  name: string;
  previewMediaId: string | null;
}

const KEYFRAMES = `
@keyframes startHintPulse {
  0%   { transform: translateX(-50%) translateY(0)    scale(1);    }
  50%  { transform: translateX(-50%) translateY(-5px) scale(1.06); }
  100% { transform: translateX(-50%) translateY(0)    scale(1);    }
}
@keyframes startHintArrow {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(5px); }
}
@keyframes startHintGlow {
  0%, 100% { box-shadow:
              0 0 0 1px rgba(255,210,120,0.9),
              0 0 18px rgba(255,180,60,0.85),
              0 0 44px rgba(255,140,20,0.55),
              0 10px 28px rgba(0,0,0,0.95); }
  50%      { box-shadow:
              0 0 0 1px rgba(255,225,150,1),
              0 0 26px rgba(255,200,90,1),
              0 0 70px rgba(255,150,30,0.8),
              0 10px 28px rgba(0,0,0,0.95); }
}
@keyframes previewFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes previewZoomIn {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1);    }
}
`;

interface Props {
  map: PlayerMap;
  selectedLocationId: string | null;
  onSelectLocation: (locationId: string | null) => void;
  onEnterLocation: (locationId: string) => void;
}

export function PlayerMapView({
  map,
  selectedLocationId,
  onSelectLocation,
  onEnterLocation,
}: Props) {
  const mapBgUrl = useMediaUrl(map.mapMediaId);

  const sortedLocations = useMemo(
    () => [...map.locations].sort((a, b) => a.mapY - b.mapY),
    [map.locations]
  );

  const selectedLocation = useMemo(
    () =>
      selectedLocationId
        ? map.locations.find((l) => l.id === selectedLocationId) ?? null
        : null,
    [map.locations, selectedLocationId]
  );

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onSelectLocation(null);
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: '#0b0a08' }}
      onClick={handleBackgroundClick}
    >
      <style>{KEYFRAMES}</style>

      {mapBgUrl ? (
        <img
          src={mapBgUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-fill
                     pointer-events-none select-none"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(201,162,74,0.06) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(201,162,74,0.06) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <div className="absolute inset-0">
        {sortedLocations.map((loc) => (
          <MapLocationNode
            key={loc.id}
            location={loc}
            mapWidth={map.mapWidth}
            mapHeight={map.mapHeight}
            selected={selectedLocationId === loc.id}
            onSelect={() => onSelectLocation(loc.id)}
          />
        ))}
      </div>

      {selectedLocation &&
        selectedLocation.unlocked &&
        createPortal(
          <LocationPreview
            location={selectedLocation}
            onBack={() => onSelectLocation(null)}
            onEnter={() => onEnterLocation(selectedLocation.id)}
          />,
          document.body
        )}
    </div>
  );
}

/**
 * Обёртка: сама решает, показать закрытую или открытую ноду.
 * Размер ноды вычисляет один раз — одинаково для закрытой и открытой,
 * чтобы при разблокировке позиция центра не смещалась.
 */
function MapLocationNode({
  location,
  mapWidth,
  mapHeight,
  selected,
  onSelect,
}: {
  location: PlayerMapLocation;
  mapWidth: number;
  mapHeight: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const url = useMediaUrl(location.mapMediaId);
  const natural = useImageSize(url);
  const { w: baseW, h: baseH } = computeMapNodeSize(natural);

  if (!location.unlocked) {
    return (
      <LockedLocationNode
        location={location}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        baseW={baseW}
        baseH={baseH}
      />
    );
  }
  return (
    <UnlockedLocationNode
      location={location}
      mapWidth={mapWidth}
      mapHeight={mapHeight}
      baseW={baseW}
      baseH={baseH}
      selected={selected}
      onSelect={onSelect}
    />
  );
}

function LockedLocationNode({
  location,
  mapWidth,
  mapHeight,
  baseW,
  baseH,
}: {
  location: PlayerMapLocation;
  mapWidth: number;
  mapHeight: number;
  baseW: number;
  baseH: number;
}) {
  const s = location.sceneScale || 1;
  const w = baseW * s;
  const h = baseH * s;

  const cxPct = ((location.mapX + baseW / 2) / mapWidth) * 100;
  const cyPct = ((location.mapY + baseH / 2) / mapHeight) * 100;
  const wPct = (w / mapWidth) * 100;
  const hPct = (h / mapHeight) * 100;

  const rotation = location.sceneRotation ?? 0;

  return (
    <div
      className="absolute select-none"
      title="Засекречено"
      style={{
        left: `${cxPct}%`,
        top: `${cyPct}%`,
        width: `${wPct}%`,
        height: `${hPct}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transformOrigin: 'center',
        zIndex: 10 + Math.round(location.mapY / 10),
        cursor: 'not-allowed',
        pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="relative w-full h-full flex flex-col items-center justify-center
                   border-2 border-dashed border-blood/50 bg-ink/85"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(156,28,28,0.4) 0 1px, transparent 1px 16px)',
          }}
        />

        <span
          className="font-poster text-[44px] md:text-[56px] leading-none
                     text-blood/85 relative"
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.95)' }}
        >
          ?
        </span>

        <span
          className="stamp-red relative mt-1.5"
          style={{
            fontSize: '9px',
            padding: '2px 8px',
            letterSpacing: '0.24em',
            opacity: 0.9,
          }}
        >
          Засекречено
        </span>

        <span
          className="absolute bottom-1.5 left-1/2 -translate-x-1/2
                     type text-[8px] uppercase tracking-[0.3em] text-bone-dim
                     whitespace-nowrap"
        >
          нет доступа
        </span>
      </div>
    </div>
  );
}

function UnlockedLocationNode({
  location,
  mapWidth,
  mapHeight,
  baseW,
  baseH,
  selected,
  onSelect,
}: {
  location: PlayerMapLocation;
  mapWidth: number;
  mapHeight: number;
  baseW: number;
  baseH: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const url = useMediaUrl(location.mapMediaId);
  const [hovered, setHovered] = useState(false);

  const s = location.sceneScale || 1;
  const w = baseW * s;
  const h = baseH * s;

  const cxPct = ((location.mapX + baseW / 2) / mapWidth) * 100;
  const cyPct = ((location.mapY + baseH / 2) / mapHeight) * 100;
  const wPct = (w / mapWidth) * 100;
  const hPct = (h / mapHeight) * 100;

  const rotation = location.sceneRotation ?? 0;
  const isEntry = location.isEntry;

  const zIndex = selected
    ? 10_000
    : hovered
    ? 500 + Math.round(location.mapY / 10)
    : 20 + Math.round(location.mapY / 10);

  const scale = hovered ? HOVER_SCALE : 1;

  return (
    <div
      className="absolute select-none"
      style={{
        left: `${cxPct}%`,
        top: `${cyPct}%`,
        width: `${wPct}%`,
        height: `${hPct}%`,
        transform: 'translate(-50%, -50%)',
        zIndex,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className="w-full h-full cursor-pointer relative block"
      >
        <div
          className="w-full h-full relative"
          style={{
            transform: `rotate(${rotation}deg) scale(${scale})`,
            transformOrigin: 'center',
            transition: 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {url ? (
            <img
              src={url}
              alt={location.name}
              draggable={false}
              className="w-full h-full object-contain pointer-events-none select-none"
            />
          ) : (
            <div
              className={
                'w-full h-full flex items-center justify-center ' +
                'transition-all duration-200 ' +
                (selected
                  ? 'bg-ink/70'
                  : hovered
                  ? 'bg-ink/60'
                  : 'bg-ink/50')
              }
            >
              <span
                className="type text-[10px] uppercase tracking-[0.2em]
                           text-bone px-2 text-center leading-tight"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
              >
                {location.name}
              </span>
            </div>
          )}
        </div>
      </button>

      <div
        className="absolute left-1/2 pointer-events-none"
        style={{
          top: '100%',
          marginTop: 6,
          transform: 'translateX(-50%)',
        }}
      >
        <span
          className={
            'type text-[11px] uppercase tracking-[0.22em] ' +
            'px-2.5 py-1 whitespace-nowrap inline-block transition-colors duration-200 ' +
            (selected
              ? 'text-ink bg-brass'
              : hovered
              ? 'text-bone bg-ink'
              : isEntry
              ? 'text-brass bg-ink'
              : 'text-bone bg-ink')
          }
          style={{
            background: selected
              ? undefined
              : 'linear-gradient(180deg, rgba(10,9,8,0.92) 0%, rgba(10,9,8,0.92) 100%)',
            textShadow: selected ? 'none' : '0 1px 2px rgba(0,0,0,1)',
          }}
        >
          {location.name}
        </span>
      </div>

      {isEntry && (
        <div
          className="absolute left-1/2 pointer-events-none"
          style={{
            bottom: '100%',
            marginBottom: 14,
            transform: 'translateX(-50%)',
            animation: 'startHintPulse 1.5s ease-in-out infinite',
            zIndex: 2,
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              position: 'relative',
              padding: '10px 22px 12px',
              background:
                'linear-gradient(180deg, rgba(12,10,8,0.96) 0%, rgba(20,15,10,0.96) 100%)',
              borderRadius: 2,
              animation: 'startHintGlow 1.5s ease-in-out infinite',
            }}
          >
            <span style={{ position: 'absolute', top: -1, left: -1, width: 10, height: 10, borderTop: '2px solid #e5b453', borderLeft: '2px solid #e5b453' }} />
            <span style={{ position: 'absolute', top: -1, right: -1, width: 10, height: 10, borderTop: '2px solid #e5b453', borderRight: '2px solid #e5b453' }} />
            <span style={{ position: 'absolute', bottom: -1, left: -1, width: 10, height: 10, borderBottom: '2px solid #e5b453', borderLeft: '2px solid #e5b453' }} />
            <span style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderBottom: '2px solid #e5b453', borderRight: '2px solid #e5b453' }} />

            <span
              className="hand inline-flex items-center"
              style={{
                fontSize: 30,
                lineHeight: 1,
                letterSpacing: '0.01em',
                color: '#ffe9a8',
                textShadow:
                  '0 0 6px rgba(255,210,120,0.9), ' +
                  '0 0 16px rgba(255,170,60,0.7), ' +
                  '0 2px 3px rgba(0,0,0,1)',
              }}
            >
              начните здесь
              <span
                className="inline-block"
                style={{
                  marginLeft: 8,
                  animation: 'startHintArrow 0.9s ease-in-out infinite',
                }}
              >
                ↓
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Экран превью локации. Используется и на карте дела, и в сцене родителя
 * (для под-локаций).
 */
export function LocationPreview({
  location,
  onBack,
  onEnter,
}: {
  location: PreviewLocation;
  onBack: () => void;
  onEnter: () => void;
}) {
  const url = useMediaUrl(location.previewMediaId);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    document.addEventListener('keydown', onEsc);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = prevOverflow;
    };
  }, [onBack]);

  return (
    <div
      className="fixed inset-0 z-[400] select-none"
      style={{
        background: '#000',
        animation: 'previewFadeIn 220ms ease-out',
      }}
      onClick={onBack}
    >
      {url ? (
        <img
          src={url}
          alt={location.name}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          style={{ animation: 'previewFadeIn 320ms ease-out' }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 40%, rgba(20,15,10,0.95) 0%, rgba(0,0,0,0.99) 100%)',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="type text-[12px] uppercase tracking-[0.3em] text-bone-muted">
              Изображение недоступно
            </span>
          </div>
        </div>
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 22%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.7) 88%, rgba(0,0,0,0.92) 100%)',
        }}
      />

      <div
        className="absolute top-0 inset-x-0 flex items-center justify-between gap-4
                   px-4 py-4 md:px-8 md:py-6 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onBack}
          className="type text-[11px] uppercase tracking-[0.26em]
                     px-4 py-2.5 bg-ink/85 backdrop-blur-sm
                     border border-brass/50 text-brass
                     hover:bg-brass/15 hover:border-brass transition-colors
                     cursor-pointer whitespace-nowrap"
        >
          ← Вернуться назад
        </button>

        <div className="type text-[10px] uppercase tracking-[0.34em]
                        text-bone-muted hidden md:block
                        bg-ink/70 backdrop-blur-sm px-3 py-2
                        border border-brass/25">
          Предпросмотр локации
        </div>
      </div>

      <div
        className="absolute bottom-0 inset-x-0 px-4 pb-6 pt-2 md:px-8 md:pb-10
                   flex flex-col items-center gap-5 z-10"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'previewZoomIn 320ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="type text-[10px] uppercase tracking-[0.34em] text-brass/80">
            Локация
          </div>
          <h2
            className="font-poster text-3xl md:text-5xl text-bone text-center
                       max-w-[90vw] break-words"
            style={{
              textShadow:
                '0 2px 8px rgba(0,0,0,0.95), 0 0 30px rgba(201,162,74,0.35)',
              letterSpacing: '0.02em',
            }}
          >
            {location.name}
          </h2>
        </div>

        <button
          type="button"
          onClick={onEnter}
          className="paper paper-old relative px-8 py-3 cursor-pointer
                     hover:scale-[1.03] active:scale-[0.99] transition-transform"
          style={{
            boxShadow:
              '0 16px 40px rgba(0,0,0,0.9), ' +
              '0 0 30px rgba(201,162,74,0.55), ' +
              'inset 0 0 0 1px rgba(201,162,74,0.5)',
          }}
        >
          <span
            className="absolute -top-2 left-1/2 -translate-x-1/2
                       w-3.5 h-3.5 rounded-full z-10"
            style={{
              background:
                'radial-gradient(circle at 32% 30%, #e44a4a 0%, #8e1a1a 45%, #4a0808 100%)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.8)',
            }}
          />
          <span
            className="hand text-[28px] md:text-[32px] leading-none text-blood
                       inline-flex items-center gap-3 whitespace-nowrap"
            style={{ transform: 'rotate(-2deg)' }}
          >
            исследовать
            <span className="text-[24px] md:text-[28px]">→</span>
          </span>
        </button>
      </div>
    </div>
  );
}