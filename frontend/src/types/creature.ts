export interface Creature {
  id: string;
  name: string;
  initiative?: number | null;
  ac?: number;
  hp?: number;
  maxHp?: number;
  notes?: string;
  initiativeModifier: number;
  isNonPlayer: boolean;
  // Stats are only required for NPCs
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
} 