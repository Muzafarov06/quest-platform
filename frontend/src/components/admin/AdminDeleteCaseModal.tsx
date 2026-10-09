import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { CaseDeleteInfo } from '../../api/admin';

interface Props {
  info: CaseDeleteInfo;
  busy?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  onGoToSessions: () => void;
}

/**
 * Модалка удаления кейса.
 *
 * Показывает:
 *   • название и код кейса;
 *   • что удалится каскадом (локации, персонажи, улики);
 *   • блокер, если у кейса есть сессии — тогда кнопка заблокирована.
 */
export function AdminDeleteCaseModal({
  info,
  busy,
  onConfirm,
  onClose,
  onGoToSessions,
}: Props) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose, busy]);

  const hasSessions = info.sessions > 0;
  const canDelete = !hasSessions;

  /* Что удалится каскадом. */
  const consequences: string[] = [];
  if (info.locations > 0) {
    consequences.push(`Локаций: ${info.locations}`);
  }
  if (info.characters > 0) {
    consequences.push(`Персонажей: ${info.characters}`);
  }
  if (info.evidences > 0) {
    consequences.push(`Улик: ${info.evidences}`);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4
                 bg-ink/85 backdrop-blur-sm overflow-y-auto"
      onClick={() => !busy && onClose()}
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
            <span className="type text-[11px] uppercase tracking-[0.28em]
                             text-ink-text-soft">
              Удалить кейс
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Закрыть"
              className="w-8 h-8 flex items-center justify-center
                         text-ink-text-dim hover:text-blood text-lg
                         transition-colors cursor-pointer
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ✕
            </button>
          </div>

          <div>
            <div className="font-mono text-[12px] tracking-[0.2em]
                            text-ink-text-dim mb-2">
              {info.caseCode} · {info.caseStatus}
            </div>
            <div className="font-poster text-2xl md:text-3xl text-ink-text
                            leading-tight mb-3">
              {info.caseTitle}
            </div>
            <p className="text-ink-text-soft text-[14px] leading-relaxed">
              Кейс и весь его контент будут удалены безвозвратно. Действие
              необратимо.
            </p>
          </div>

          {/* Блокеры — сессии. */}
          {hasSessions && (
            <div className="border-l-4 border-blood bg-blood/10 px-4 py-3
                            flex flex-col gap-2">
              <div className="type text-[11px] uppercase tracking-[0.24em]
                              text-blood">
                Нельзя удалить
              </div>
              <div className="text-ink-text text-[13px] leading-relaxed">
                У кейса <strong>{info.sessions}</strong>{' '}
                {info.sessions === 1 ? 'сессия' : 'сессий'}. Они ссылаются
                на кейс, и БД запрещает удаление. Сначала удалите все
                сессии в «Моих расследованиях».
              </div>
              <button
                type="button"
                onClick={onGoToSessions}
                className="self-start mt-1 type text-[11px] uppercase
                           tracking-[0.24em] text-blood underline
                           underline-offset-4 decoration-dotted
                           hover:text-blood-hover transition-colors cursor-pointer"
              >
                Перейти к сессиям →
              </button>
            </div>
          )}

          {/* Что удалится. */}
          {canDelete && consequences.length > 0 && (
            <div className="border-l-4 border-brass bg-brass/10 px-4 py-3
                            flex flex-col gap-2">
              <div className="type text-[11px] uppercase tracking-[0.24em]
                              text-ink-text-soft">
                Удалится вместе с кейсом
              </div>
              <ul className="list-disc list-inside text-ink-text text-[13px]
                             space-y-1">
                {consequences.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {canDelete && consequences.length === 0 && (
            <div className="border-l-4 border-brass bg-brass/10 px-4 py-3
                            type text-[13px] text-ink-text-soft">
              Внутри кейса нет контента — удалится только карточка дела.
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
                         transition-colors cursor-pointer
                         disabled:opacity-40 disabled:cursor-not-allowed"
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
                         disabled:opacity-40 disabled:cursor-not-allowed
                         cursor-pointer"
            >
              {busy ? 'Удаляем…' : 'Удалить кейс'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}