export type BookId = 'sportybet' | 'bet9ja' | 'betking' | 'pinnacle';
export type BookStatus = 'active' | 'coming_soon' | 'disabled';

export interface BookConfig {
  id: BookId;
  label: string;
  status: BookStatus;
  role?: string;
}

export const BOOKS = [
  { id: 'sportybet', label: 'SportyBet', status: 'active' },
  { id: 'bet9ja', label: 'Bet9ja', status: 'coming_soon' },
  { id: 'betking', label: 'BetKing', status: 'coming_soon' },
  { id: 'pinnacle', label: 'Pinnacle', status: 'coming_soon', role: 'sharp_benchmark' },
] as const;
