import { NODE_WIDTH, NODE_HEIGHT } from './LocationNode';

interface Props {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label: string | null;
  bidirectional: boolean;
  selected: boolean;
  onClick: () => void;
}

/**
 * Тонкая линия-связь между двумя карточками.
 * Без стрелок — направление читается по выбранной локации на карте.
 */
export function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  label,
  bidirectional,
  selected,
  onClick,
}: Props) {
  const x1 = fromX + NODE_WIDTH / 2;
  const y1 = fromY + NODE_HEIGHT / 2;
  const x2 = toX + NODE_WIDTH / 2;
  const y2 = toY + NODE_HEIGHT / 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const pad = 60;

  const sx = x1 + (dx / len) * pad;
  const sy = y1 + (dy / len) * pad;
  const ex = x2 - (dx / len) * pad;
  const ey = y2 - (dy / len) * pad;

  const midX = (sx + ex) / 2;
  const midY = (sy + ey) / 2;

  return (
    <g>
      {/* Кликабельная широкая невидимая линия */}
      <line
        x1={sx}
        y1={sy}
        x2={ex}
        y2={ey}
        stroke="transparent"
        strokeWidth={14}
        style={{ cursor: 'pointer' }}
        onClick={onClick}
      />

      {/* Основная линия — тонкая, пунктиром */}
      <line
        x1={sx}
        y1={sy}
        x2={ex}
        y2={ey}
        stroke={selected ? 'rgba(156,28,28,0.9)' : 'rgba(201,162,74,0.55)'}
        strokeWidth={selected ? 2 : 1.2}
        strokeDasharray="6 4"
        style={{ pointerEvents: 'none' }}
      />

      {/* Подпись посередине — только если есть */}
      {label && selected && (
        <g style={{ pointerEvents: 'none' }}>
          <rect
            x={midX - label.length * 3.5 - 8}
            y={midY - 10}
            width={label.length * 7 + 16}
            height={20}
            fill="rgba(10,9,7,0.95)"
            stroke="rgba(201,162,74,0.5)"
          />
          <text
            x={midX}
            y={midY + 4}
            textAnchor="middle"
            fill="#ece2c9"
            fontSize="11"
            fontFamily="var(--font-type, monospace)"
            letterSpacing="0.1em"
          >
            {label}
          </text>
        </g>
      )}

      {/* Индикатор двусторонней связи — точка в середине */}
      {bidirectional && (
        <circle
          cx={midX}
          cy={midY}
          r={3}
          fill="rgba(201,162,74,0.9)"
          stroke="rgba(10,9,7,0.9)"
          strokeWidth={1}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </g>
  );
}