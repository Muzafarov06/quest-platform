import { useMediaUrl } from '../hooks/useMediaUrl';

interface Props {
  mediaId: string | null | undefined;
  alt: string;
  className?: string;
}

export function MediaImage({ mediaId, alt, className }: Props) {
  const url = useMediaUrl(mediaId);

  if (!url) {
    return (
      <div className={'bg-slate-200 flex items-center justify-center ' + (className ?? '')}>
        <span className="text-slate-400 text-xs">Нет изображения</span>
      </div>
    );
  }

  return <img src={url} alt={alt} className={className} />;
}