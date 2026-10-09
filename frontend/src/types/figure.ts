export interface Figure {
  id: string;
  code: string;
  label: string;
  fallbackEmoji: string;
  mediaId: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}