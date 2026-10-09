export type EvidenceType =
  | 'DOCUMENT'
  | 'PHOTO'
  | 'AUDIO'
  | 'VIDEO'
  | 'PHYSICAL'
  | 'DIGITAL'
  | 'TESTIMONY'
  | 'OTHER';

export type EvidenceImportance = 'KEY' | 'SUPPORTING' | 'RED_HERRING';

export interface Evidence {
  id: string;
  caseId: string;
  objectId: string | null;
  locationId: string | null;
  mediaId: string | null;      // ← новое
  objectName: string | null;
  locationName: string | null;
  title: string;
  description: string | null;
  contentText: string | null;
  evidenceType: EvidenceType;
  importance: EvidenceImportance;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}