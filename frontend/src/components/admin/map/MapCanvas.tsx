interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
  children: React.ReactNode;
  svgChildren?: React.ReactNode;
  onBackgroundClick?: () => void;
  /** Режим связей — подсветка рамки + курсор. */
  linkMode?: boolean;
}

export function MapCanvas({
  containerRef,
  width,
  height,
  children,
  svgChildren,
  onBackgroundClick,
  linkMode = false,
}: Props) {
  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        if (e.target === containerRef.current) onBackgroundClick?.();
      }}
      className={
        'relative overflow-auto scroll-map border bg-ink/70 transition-colors ' +
        (linkMode
          ? 'border-blood ring-2 ring-blood/40 cursor-crosshair'
          : 'border-brass/30')
      }
      style={{
        height: 'calc(100vh - 240px)',
        boxShadow:
          'inset 0 0 0 1px rgba(0,0,0,0.5), 0 12px 40px rgba(0,0,0,0.6)',
      }}
    >
      <div
        className="relative"
        style={{ width, height, minWidth: '100%', minHeight: '100%' }}
      >
        {/* Сетка */}
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(rgba(201,162,74,0.08) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(201,162,74,0.08) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* SVG-слой для связей */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={width}
          height={height}
          style={{ zIndex: 10 }}
        >
          <defs>
            <marker
              id="arrow-end"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="rgba(201,162,74,0.9)" />
            </marker>
            <marker
              id="arrow-start"
              viewBox="0 0 10 10"
              refX="1"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M10,0 L0,5 L10,10 z" fill="rgba(201,162,74,0.9)" />
            </marker>
          </defs>
          <g style={{ pointerEvents: 'auto' }}>{svgChildren}</g>
        </svg>

        {/* Карточки */}
        <div className="absolute inset-0" style={{ zIndex: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
}