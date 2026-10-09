import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  type Participant,
} from 'livekit-client';
import { getVoiceToken } from '../api/voice';

export interface VoiceParticipant {
  identity: string;
  name: string;
  isSpeaking: boolean;
  isLocal: boolean;
}

export interface VoiceRoomState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  muted: boolean;
  participants: VoiceParticipant[];
}

export function useVoiceRoom(sessionId: string | null | undefined, enabled: boolean) {
  const roomRef = useRef<Room | null>(null);
  const [state, setState] = useState<VoiceRoomState>({
    connected: false,
    connecting: false,
    error: null,
    muted: false,
    participants: [],
  });

  const refreshParticipants = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    const list: VoiceParticipant[] = [];
    list.push({
      identity: room.localParticipant.identity,
      name: room.localParticipant.name || room.localParticipant.identity,
      isSpeaking: room.localParticipant.isSpeaking,
      isLocal: true,
    });

    room.remoteParticipants.forEach((p: Participant) => {
      list.push({
        identity: p.identity,
        name: p.name || p.identity,
        isSpeaking: p.isSpeaking,
        isLocal: false,
      });
    });

    setState((prev) => ({ ...prev, participants: list }));
  }, []);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    let cancelled = false;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    setState((prev) => ({ ...prev, connecting: true, error: null }));

    room
      .on(RoomEvent.ParticipantConnected, refreshParticipants)
      .on(RoomEvent.ParticipantDisconnected, refreshParticipants)
      .on(RoomEvent.ActiveSpeakersChanged, refreshParticipants)
      .on(RoomEvent.LocalTrackPublished, refreshParticipants)
      .on(RoomEvent.TrackMuted, refreshParticipants)
      .on(RoomEvent.TrackUnmuted, refreshParticipants);

    (async () => {
      try {
        const { url, token } = await getVoiceToken(sessionId);
        if (cancelled) return;

        await room.connect(url, token);
        if (cancelled) {
          await room.disconnect();
          return;
        }

        await room.localParticipant.setMicrophoneEnabled(true);

        setState((prev) => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
          muted: false,
        }));
        refreshParticipants();
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Ошибка подключения к голосу';
        setState((prev) => ({
          ...prev,
          connecting: false,
          error: msg,
        }));
      }
    })();

    return () => {
      cancelled = true;
      room.disconnect();
      roomRef.current = null;
    };
  }, [sessionId, enabled, refreshParticipants]);

  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const local = room.localParticipant;
    const next = !local.isMicrophoneEnabled;
    await local.setMicrophoneEnabled(next);
    setState((prev) => ({ ...prev, muted: !next }));
    refreshParticipants();
  }, [refreshParticipants]);

  return { ...state, toggleMute };
}