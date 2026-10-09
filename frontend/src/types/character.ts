export type CharacterUnlockMode =
  | 'AUTO'
  | 'ALWAYS'
  | 'LOCATION_OPENED'
  | 'EVIDENCE_FOUND';

export interface CharacterDialog {
  id: string;
  question: string;
  answer: string;
  requiresEvidenceId: string | null;
  sortOrder: number;
}

export interface Character {
  id: string;
  caseId: string;
  locationId: string | null;
  name: string;
  description: string | null;
  portraitMediaId: string | null;
  dialogueMediaId: string | null;
  sortOrder: number;
  posX: number;
  posY: number;
  sceneScale: number;
  sceneRotation: number;
  unlockMode: CharacterUnlockMode;
  unlockTargetId: string | null;
  dialogs: CharacterDialog[];
}

export interface CharacterAdmin extends Character {
  biography: string | null;
}

export interface CreateCharacterRequest {
  name: string;
  description?: string;
  biography?: string;
  locationId?: string | null;
  portraitMediaId?: string | null;
  dialogueMediaId?: string | null;
  sortOrder?: number;
  posX?: number;
  posY?: number;
  sceneScale?: number;
  sceneRotation?: number;
  unlockMode?: CharacterUnlockMode;
  unlockTargetId?: string | null;
}

export interface UpdateCharacterRequest {
  name: string;
  description?: string;
  biography?: string;
  locationId?: string | null;
  portraitMediaId?: string | null;
  dialogueMediaId?: string | null;
  sortOrder?: number;
  posX?: number;
  posY?: number;
  sceneScale?: number;
  sceneRotation?: number;
  unlockMode?: CharacterUnlockMode;
  unlockTargetId?: string | null;
}

export interface CreateDialogRequest {
  question: string;
  answer: string;
  requiresEvidenceId?: string | null;
  sortOrder?: number;
}

export interface UpdateDialogRequest {
  question: string;
  answer: string;
  requiresEvidenceId?: string | null;
  sortOrder?: number;
}