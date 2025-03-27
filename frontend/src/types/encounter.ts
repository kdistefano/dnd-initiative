import { Creature } from './creature';

export interface Encounter {
  id: string;
  name: string;
  userId: number;
  entries: Creature[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
} 