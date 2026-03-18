'use client';

import { Card as CardType } from '@/lib/types';
import CardComponent from './Card';

interface PlayerGridProps {
  cards: CardType[];
  isCurrentPlayer: boolean;
  isMyHand: boolean;
  onCardClick?: (index: number) => void;
  selectedCard?: number | null;
  revealAll?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function PlayerGrid({
  cards,
  isCurrentPlayer,
  isMyHand: _isMyHand,
  onCardClick,
  selectedCard,
  revealAll,
  size = 'sm',
}: PlayerGridProps) {
  const displayCards = [...cards];
  while (displayCards.length < 4) {
    displayCards.push(null as unknown as CardType);
  }

  return (
    <div className={`grid grid-cols-2 gap-1 ${isCurrentPlayer ? 'ring-2 ring-yellow-400 rounded-lg p-1' : ''}`}>
      {displayCards.slice(0, 4).map((card, index) => (
        <CardComponent
          key={index}
          card={card}
          faceUp={revealAll || (card && card.face_up) || false}
          onClick={onCardClick ? () => onCardClick(index) : undefined}
          selected={selectedCard === index}
          size={size}
        />
      ))}
    </div>
  );
}
