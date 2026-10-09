export interface InventoryItem {
  id: string;
  sessionId: string;
  playerId: string;
  evidenceId: string;
  addedAt: string;
}

export interface DiscoveredEvidence {
  id: string;
  sessionId: string;
  evidenceId: string;
  discoveredBy: string;
  discoveredAt: string;
}