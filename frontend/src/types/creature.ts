export interface Creature {
  id: string;
  name: string;
  ac?: number;
  hp?: number;
  maxHp?: number;
  notes?: string;
  initiativeModifier: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  isNonPlayer: boolean;
} 