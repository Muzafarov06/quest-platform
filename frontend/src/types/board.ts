export type BoardItemType = 'EVIDENCE' | 'NOTE' | 'HYPOTHESIS' | 'QUESTION';

export interface BoardItem {
  id: string;
  sessionId: string;
  createdBy: string;
  createdByName: string | null;
  itemType: BoardItemType;
  title: string | null;
  content: string | null;
  evidenceId: string | null;
  posX: number;
  posY: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoardConnection {
  id: string;
  sessionId: string;
  fromItemId: string;
  toItemId: string;
  label: string | null;
  createdAt: string;
}

export interface CreateBoardItemRequest {
  itemType: BoardItemType;
  title?: string;
  content?: string;
  evidenceId?: string;
  posX?: number;
  posY?: number;
}