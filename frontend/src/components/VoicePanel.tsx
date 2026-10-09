import { useVoiceRoom } from '../hooks/useVoiceRoom';

/**
 * Голосовая панель сессии.
 *
 * На текущем этапе функция отключена — WebRTC-медиа не проходит
 * через российских провайдеров к LiveKit Cloud (блокировка UDP).
 * Включим, когда переедем на self-hosted LiveKit на VPS.
 *
 * Чтобы включить обратно — выставь VOICE_FEATURE_ENABLED = true.
 * Больше ничего менять не нужно.
 */
const VOICE_FEATURE_ENABLED = false;

interface Props {
  sessionId: string;
  enabled: boolean;
}

export function VoicePanel({ sessionId, enabled }: Props) {
  // Заглушка — пока голос не работает.
  if (!VOICE_FEATURE_ENABLED) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-dashed border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            🎙 Голос
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">
            скоро
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Голосовой чат появится после переезда на self-hosted сервер.
          Пока общайтесь в Discord / Telegram.
        </p>
      </div>
    );
  }

  return <ActiveVoicePanel sessionId={sessionId} enabled={enabled} />;
}

function ActiveVoicePanel({ sessionId, enabled }: Props) {
  const voice = useVoiceRoom(sessionId, enabled);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          🎙 Голос
        </h3>
        <span className={
          'text-xs px-2 py-0.5 rounded ' +
          (voice.connected ? 'bg-green-100 text-green-800'
            : voice.connecting ? 'bg-yellow-100 text-yellow-800'
            : voice.error ? 'bg-red-100 text-red-800'
            : 'bg-slate-100 text-slate-600')
        }>
          {voice.connected ? 'в эфире'
            : voice.connecting ? 'подключение...'
            : voice.error ? 'ошибка'
            : 'выкл'}
        </span>
      </div>

      {voice.error && (
        <div className="mb-2 px-2 py-1.5 bg-red-100 text-red-800 rounded text-xs">
          {voice.error}
        </div>
      )}

      {voice.connected && (
        <>
          <button
            onClick={voice.toggleMute}
            className={
              'w-full px-3 py-2 rounded text-sm font-medium mb-3 transition-colors cursor-pointer ' +
              (voice.muted
                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                : 'bg-green-100 text-green-800 hover:bg-green-200')
            }
          >
            {voice.muted ? '🔇 Включить микрофон' : '🎤 Выключить микрофон'}
          </button>

          <ul className="space-y-1">
            {voice.participants.map((p) => (
              <li
                key={p.identity}
                className={
                  'flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ' +
                  (p.isSpeaking ? 'bg-emerald-50 border border-emerald-200' : '')
                }
              >
                <span className={
                  'w-2 h-2 rounded-full flex-shrink-0 ' +
                  (p.isSpeaking ? 'bg-emerald-500' : 'bg-slate-300')
                } />
                <span className="truncate text-slate-800">
                  {p.name}
                  {p.isLocal && <span className="text-slate-400 ml-1">(вы)</span>}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {!voice.connected && !voice.connecting && !voice.error && (
        <p className="text-xs text-slate-500">
          Голос включится автоматически после подключения к сессии.
        </p>
      )}
    </div>
  );
}