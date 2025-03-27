export interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number;
  isNonPlayer: boolean;
  ac?: number;
  hp?: number;
  maxHp?: number;
  notes?: string;
}

export interface InitiativeState {
  entries: InitiativeEntry[];
  currentTurn: number;
  isActive: boolean;
} 