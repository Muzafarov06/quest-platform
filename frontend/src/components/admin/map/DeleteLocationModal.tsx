import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { LocationDeleteInfo } from '../../../api/locations';

interface Props {
  info: LocationDeleteInfo;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  busy?: boolean;
}

/**
 * Модалка удаления локации: показывает, что удалится,
 * и блокирует кнопку, если есть препятствия.
 */
export function DeleteLocationModal({ info, onConfirm, onClose, busy }: Props) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  /* Что мешает удалить. */
  const blockers: string[] = [];
  if (info.childLocations > 0) {
    blockers.push(
      `Есть вложенные локации: ${info.childLocations}. Сначала удалите или переназначьте их.`
    );
  }
  if (info.isEntry) {
    blockers.push(
      'Это стартовая локация кейса. Смените стартовую локацию на карте дела.'
    );
  }
  if (info.activeSessions > 0) {
    blockers.push(
      `Локация открыта в активных сессиях: ${info.activeSessions}. Завершите сессии.`
    );
  }

  const canDelete = blockers.length === 0;

  /* Что удалится каскадом. */
  const consequences: string[] = [];
  if (info.objects > 0) {
    consequences.push(`Объектов удалится: ${info.objects}`);
  }
  if (info.connections > 0) {
    consequences.push(`Связей удалится: ${info.connections}`);
  }
  if (info.evidencesByLocation > 0) {
    consequences.push(
      `Улик потеряют привязку к локации: ${info.evidencesByLocation}`
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4
                 bg-ink/85 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />

        <div className="paper paper-old p-6 md:p-8 relative flex flex-col gap-5">
          <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
            <span className="stamp-red text-xs">Удаление</span>
          </div>

          <div className="flex items-baseline justify-between pb-3
                          border-b border-ink-text/20">
            <span className="type text-[11px] uppercase tracking-[0.28em] text-ink-text-soft">
              Удалить локацию
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="w-8 h-8 flex items-center justify-center
                         text-ink-text-dim hover:text-blood text-lg
                         transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div>
            <div className="font-poster text-2xl text-ink-text leading-tight mb-2">
              {info.locationName}
            </div>
            <p className="text-ink-text-soft text-[14px] leading-relaxed">
              Локация будет удалена. Действие необратимо.
            </p>
          </div>

          {blockers.length > 0 && (
            <div className="border-l-4 border-blood bg-blood/10 px-4 py-3
                            flex flex-col gap-2">
              <div className="type text-[11px] uppercase tracking-[0.24em] text-blood">
                Нельзя удалить
              </div>
              <ul className="list-disc list-inside text-ink-text text-[13px] space-y-1">
                {blockers.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {canDelete && consequences.length > 0 && (
            <div className="border-l-4 border-brass bg-brass/10 px-4 py-3
                            flex flex-col gap-2">
              <div className="type text-[11px] uppercase tracking-[0.24em]
                              text-ink-text-soft">
                Удалится вместе с локацией
              </div>
              <ul className="list-disc list-inside text-ink-text text-[13px] space-y-1">
                {consequences.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {canDelete && consequences.length === 0 && (
            <div className="border-l-4 border-brass bg-brass/10 px-4 py-3
                            type text-[13px] text-ink-text-soft">
              Зависимостей нет — удалится только локация.
            </div>
          )}

          <div className="flex gap-3 pt-2 justify-end flex-wrap">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-5 py-3 border border-ink-text/40 text-ink-text
                         type text-[12px] uppercase tracking-[0.24em]
                         hover:border-ink-text/70 hover:bg-black/5
                         transition-colors cursor-pointer disabled:opacity-40"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canDelete || busy}
              className="bg-blood text-paper px-5 py-3
                         type text-[12px] uppercase tracking-[0.24em]
                         hover:bg-blood-hover transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {busy ? 'Удаляем…' : 'Удалить'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}