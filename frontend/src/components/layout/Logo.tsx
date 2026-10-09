import { Link } from 'react-router-dom';

interface Props {
  compact?: boolean;
}

export function Logo({ compact = false }: Props) {
  return (
    <Link to="/" className="flex items-center gap-1 shrink-0">
      {/* Иконка — PNG */}
      <div className="relative shrink-0">
        <img
          src="/images/logo.png"
          alt="Razgadka"
          draggable={false}
          className="w-14 h-14 md:w-16 md:h-16 block select-none pointer-events-none"
        />
      </div>

      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-2xl md:text-3xl text-bone tracking-[0.12em]">
            Razgadka
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-blood mt-1">
            детектив с ИИ
          </span>
        </div>
      )}
    </Link>
  );
}