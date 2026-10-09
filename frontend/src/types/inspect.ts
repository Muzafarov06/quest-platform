export interface InspectEvidenceItem {
  evidenceId: string;
  title: string;
  description: string | null;
  contentText: string | null;
  evidenceType: string;
  importance: string;
  mediaId: string | null;
  discoveredByPlayerId: string;
  discoveredByPlayerName: string | null;
  discoveredAt: string;
  inMyInventory: boolean;
}

export interface ObjectInspectResponse {
  objectId: string;
  objectName: string;
  objectDescription: string | null;
  objectType: string;
  objectState: string;
  objectMediaId: string | null;
  evidences: InspectEvidenceItem[];
}