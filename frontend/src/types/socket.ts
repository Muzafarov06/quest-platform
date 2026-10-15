import type { GameEvent } from './action';
import type { BoardItem } from './board';

export interface PlayerEnteredLocationEvent {
  type: 'PLAYER_ENTERED_LOCATION';
  playerName: string;
  locationId: string;
  locationName: string;
}

export interface PlayerInteractedEvent {
  type: 'PLAYER_INTERACTED';
  playerName: string;
  objectId: string;
  objectName: string;
}

export interface GameEventTriggeredEvent {
  type: 'GAME_EVENT';
  event: GameEvent;
}

export interface PlayerLeftEvent {
  type: 'PLAYER_LEFT';
  playerName: string;
}

export interface PlayerJoinedEvent {
  type: 'PLAYER_JOINED';
  playerName: string;
}

export interface PlayerUpdatedEvent {
  type: 'PLAYER_UPDATED';
  playerId: string;
}

export interface BoardItemAddedEvent {
  type: 'BOARD_ITEM_ADDED';
  item: BoardItem;
  playerName: string;
}

export interface BoardItemRemovedEvent {
  type: 'BOARD_ITEM_REMOVED';
  itemId: string;
}

export interface BoardItemMovedEvent {
  type: 'BOARD_ITEM_MOVED';
  itemId: string;
  posX: number;
  posY: number;
  playerName?: string;
}

export interface BoardNoteUpdatedEvent {
  type: 'BOARD_NOTE_UPDATED';
  text: string;
  updatedByPlayerName: string | null;
  updatedAt: string | null;
}

export interface BoardNoteTypingEvent {
  type: 'BOARD_NOTE_TYPING';
  text: string;
  playerName: string;
}

export interface SessionStartedEvent {
  type: 'SESSION_STARTED';
}

export interface SessionFinishedEvent {
  type: 'SESSION_FINISHED';
}

export interface SessionClosedEvent {
  type: 'SESSION_CLOSED';
  reason?: string;
}

export interface PlayerKickedEvent {
  type: 'PLAYER_KICKED';
  playerId: string;
  playerName: string;
}

export interface PlayerMovedEvent {
  type: 'PLAYER_MOVED';
  playerId: string;
  playerName: string;
  x: number;
  y: number;
  facing: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  locationId?: string;
}

export interface LocationUnlockedEvent {
  type: 'LOCATION_UNLOCKED';
  locationId: string;
  locationName: string;
  hint?: string;
}

export interface FinalAnswerStartedEvent {
  type: 'FINAL_ANSWER_STARTED';
  ownerName: string;
}

export interface EvidenceTakenEvent {
  type: 'EVIDENCE_TAKEN';
  evidenceId: string;
  evidenceTitle: string;
  playerName: string;
}

export type SessionSocketEvent =
  | PlayerEnteredLocationEvent
  | PlayerInteractedEvent
  | GameEventTriggeredEvent
  | PlayerLeftEvent
  | PlayerJoinedEvent
  | PlayerUpdatedEvent
  | BoardItemAddedEvent
  | BoardItemRemovedEvent
  | BoardItemMovedEvent
  | BoardNoteUpdatedEvent
  | BoardNoteTypingEvent
  | SessionStartedEvent
  | SessionFinishedEvent
  | SessionClosedEvent
  | PlayerKickedEvent
  | FinalAnswerStartedEvent
  | PlayerMovedEvent
  | LocationUnlockedEvent
  | EvidenceTakenEvent;