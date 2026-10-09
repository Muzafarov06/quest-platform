import { useRef, useState } from 'react';
import { useMediaUrl } from '../../hooks/useMediaUrl';
import { uploadCaseMedia, deleteCaseMedia } from '../../api/media';
import type { ApiErrorResponse } from '../../types/api';

interface Props {
  caseId: string;
  /** Текущий mediaId (из case_media). */
  value: string | null;
  /** Вызывается с новым mediaId или null (если убрали). */
  onChange: (mediaId: string | null) => void;
  /** Заголовок над превью. */
  label?: string;
  /** Подсказка под превью. */
  hint?: string;
  /** Соотношение превью. */
  aspect?: 'square' | 'video' | 'portrait';
  /** Удалять старый файл при замене (по умолчанию — нет). */
  deleteOldOnReplace?: boolean;
}

const ASPECT: Record<NonNullable<Props['aspect']>, string> = {
  square: 'aspect-square',
  video: 'aspect-[16/10]',
  portrait: 'aspect-[3/4]',
};

/**
 * Универсальный загрузчик одной картинки кейса.
 *
 * Не сохраняет в форме сам — только возвращает новый mediaId
 * через onChange. Родитель решает, когда отправить PUT/POST.
 */
export function MediaUploader({
  caseId,
  value,
  onChange,
  label = 'Изображение',
  hint,
  aspect = 'video',
  deleteOldOnReplace = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = useMediaUrl(value);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    setError(null);
    setIsUploading(true);
    try {
      const media = await uploadCaseMedia(caseId, file);

      // удаляем старый, если попросили и он был
      if (deleteOldOnReplace && value) {
        try {
          await deleteCaseMedia(value);
        } catch {
          // не критично
        }
      }

      onChange(media.id);
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось загрузить файл.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="type text-[11px] uppercase tracking-[0.24em] text-ink-text-dim">
        {label}
      </span>

      <div className="flex items-start gap-4">
        {/* Превью */}
        <div
          className={
            'relative w-40 shrink-0 border-2 border-dashed overflow-hidden ' +
            ASPECT[aspect] + ' ' +
            (url ? 'border-ink-text/40' : 'border-blood/50 bg-blood/5')
          }
        >
          {url ? (
            <img
              src={url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center
                            type text-[10px] uppercase tracking-[0.22em] text-ink-text-dim
                            text-center px-2">
              Нет изображения
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-ink/70 flex items-center justify-center
                            type text-[11px] uppercase tracking-[0.24em] text-bone">
              Загрузка…
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex flex-col gap-2 min-w-0">
          <button
            type="button"
            onClick={handlePick}
            disabled={isUploading}
            className={
              'px-4 py-2 border-2 border-dashed transition-colors ' +
              'type text-[11px] uppercase tracking-[0.22em] cursor-pointer ' +
              (isUploading
                ? 'border-ink-text/20 text-ink-text/40 cursor-wait'
                : url
                ? 'border-ink-text/40 text-ink-text hover:border-blood hover:text-blood'
                : 'border-blood/60 text-blood hover:border-blood hover:bg-blood/5')
            }
          >
            {url ? 'Заменить' : 'Загрузить'}
          </button>

          {url && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="px-4 py-2 border border-blood/40
                         type text-[11px] uppercase tracking-[0.22em]
                         text-blood hover:bg-blood/10
                         transition-colors cursor-pointer"
            >
              Убрать
            </button>
          )}

          {hint && !error && (
            <span className="type text-[11px] text-ink-text-dim">
              {hint}
            </span>
          )}

          {error && (
            <span className="type text-[11px] text-blood">
              {error}
            </span>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}