import { Card, Suit, FaceValue } from './types';

export function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values: FaceValue[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function cardValue(card: Card): number {
  if (card.value === 'A') return 1;
  if (card.value === 'J' || card.value === 'Q' || card.value === 'K') return 10;
  return card.value as number;
}

export function dealCards(deck: Card[], playerIds: string[]): {
  hands: Record<string, Card[]>;
  remainingDeck: Card[];
  firstDiscard: Card;
} {
  const d = [...deck];
  const hands: Record<string, Card[]> = {};
  for (const pid of playerIds) {
    hands[pid] = d.splice(0, 4);
  }
  const firstDiscard = d.splice(0, 1)[0];
  firstDiscard.face_up = true;
  return { hands, remainingDeck: d, firstDiscard };
}

export function isSpecial(card: Card): boolean {
  return card.value === 7 || card.value === 8 || card.value === 9;
}

export function handSum(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + cardValue(c), 0);
}

export function determineWinners(hands: Record<string, Card[]>): string[] {
  const sums = Object.entries(hands).map(([uid, cards]) => ({ uid, sum: handSum(cards) }));
  const minSum = Math.min(...sums.map(s => s.sum));
  return sums.filter(s => s.sum === minSum).map(s => s.uid);
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
