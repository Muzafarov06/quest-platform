import { useMediaUrl } from '../hooks/useMediaUrl';
import { useFigures } from '../hooks/useFigures';

interface Props {
  code: string;
  alt: string;
  className?: string;
}

/**
 * Картинка фигурки: тянет media_id из кеша фигурок и presigned URL.
 * Если PNG нет — показывает логотип платформы.
 */
export function FigureImage({ code, alt, className = '' }: Props) {
  const figures = useFigures();
  const figure = figures?.find((f) => f.code === code);
  const url = useMediaUrl(figure?.mediaId ?? null);

  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        draggable={false}
        className={'object-contain select-none pointer-events-none ' + className}
      />
    );
  }

  return (
    <img
      src="/images/logo.png"
      alt={alt}
      draggable={false}
      className={'object-contain select-none pointer-events-none ' + className}
    />
  );
}