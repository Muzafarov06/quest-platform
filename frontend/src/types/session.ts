export type SessionStatus = 'LOBBY' | 'ACTIVE' | 'FINISHED' | 'ABANDONED';
export type Facing = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface GameSession {
  id: string;
  caseId: string;
  ownerUserId: string;
  roomCode: string;
  status: SessionStatus;
  isTest: boolean;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface SessionPlayer {
  id: string;
  sessionId: string;
  userId: string | null;
  guestToken: string | null;
  displayName: string;
  avatarKey: string;
  posX: number;
  posY: number;
  facing: Facing;
  /** Локация, где игрок сейчас. null — на карте дела. */
  currentLocationId: string | null;
  joinedAt: string;
  lastSeenAt: string | null;
  active: boolean;
  ready: boolean;
}

export interface JoinSessionRequest {
  displayName: string;
  avatarKey?: string;
}

export interface JoinSessionResponse {
  session: GameSession;
  player: SessionPlayer;
  guestToken: string | null;
}