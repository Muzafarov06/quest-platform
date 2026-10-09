export type ConditionType =
  | 'OBJECT_INTERACTED'
  | 'LOCATION_VISITED'
  | 'EVIDENCE_DISCOVERED'
  | 'PUZZLE_SOLVED';

export type EventType =
  | 'SHOW_MESSAGE'
  | 'REVEAL_EVIDENCE'
  | 'UNLOCK_OBJECT'
  | 'UNLOCK_LOCATION'
  | 'DISPATCH_CALL';

export interface ActionRequest {
  actionType: ConditionType;
  targetId: string | null;
}

export interface GameEvent {
  id: string;
  caseId: string;
  conditionId: string | null;
  eventType: EventType;
  targetId: string | null;
  message: string | null;
  once: boolean;
  sortOrder: number;
}

export interface ActionResponse {
  triggeredEvents: GameEvent[];
}

export interface SessionActionRequest {
  actionType: ConditionType;
  targetId: string | null;
}

export interface SessionActionResponse {
  triggeredEvents: GameEvent[];
}