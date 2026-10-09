export type CaseStatus = 'DRAFT' | 'TESTING' | 'PUBLISHED' | 'ARCHIVED';

export interface Case {
  id: string;
  code: string;
  title: string;
  description: string | null;
  genre: string;
  ageLimit: number;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: number | null;
  priceCents: number;
  coverMediaId: string | null;
  mapMediaId: string | null;
  entryLocationId: string | null;
  mapWidth: number;
  mapHeight: number;
  status: CaseStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}