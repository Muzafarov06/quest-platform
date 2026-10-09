export interface LocationConnection {
  id: string;
  caseId: string;
  fromLocationId: string;
  toLocationId: string;
  label: string | null;
  sortOrder: number;
  posX: number | null;
  posY: number | null;
  createdAt: string;
  updatedAt: string;
}