'use client';

import { Card as CardType } from '@/lib/types';

interface CardProps {
  card: CardType | null;
  faceUp?: boolean;
  onClick?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<string, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-gray-900',
  spades: 'text-gray-900',
};

const SIZE_CLASSES = {
  sm: 'w-12 h-16 text-xs',
  md: 'w-16 h-22 text-sm',
  lg: 'w-20 h-28 text-base',
};

export default function CardComponent({ card, faceUp = false, onClick, selected, size = 'md', className = '' }: CardProps) {
  const sizeClass = SIZE_CLASSES[size];
  const isClickable = !!onClick;

  if (!card) {
    return (
      <div className={`${sizeClass} rounded-lg border-2 border-dashed border-green-600 ${className}`} />
    );
  }

  const showFace = faceUp || card.face_up;

  if (!showFace) {
    return (
      <div
        onClick={onClick}
        className={`${sizeClass} rounded-lg bg-blue-900 border-2 ${selected ? 'border-yellow-400 shadow-yellow-400 shadow-lg' : 'border-blue-700'} ${isClickable ? 'cursor-pointer hover:border-yellow-300 hover:shadow-md transition-all' : ''} flex items-center justify-center ${className}`}
      >
        <div className="text-blue-600 text-lg">🂠</div>
      </div>
    );
  }

  const suitSymbol = SUIT_SYMBOLS[card.suit] || '?';
  const suitColor = SUIT_COLORS[card.suit] || 'text-gray-900';

  return (
    <div
      onClick={onClick}
      className={`${sizeClass} rounded-lg bg-white border-2 ${selected ? 'border-yellow-400 shadow-yellow-400 shadow-lg' : 'border-gray-300'} ${isClickable ? 'cursor-pointer hover:border-yellow-300 hover:shadow-md transition-all' : ''} flex flex-col justify-between p-1 ${className}`}
    >
      <div className={`font-bold ${suitColor} leading-none`} style={{ fontSize: size === 'sm' ? '0.6rem' : '0.75rem' }}>
        <div>{card.value}</div>
        <div>{suitSymbol}</div>
      </div>
      <div className={`font-bold ${suitColor} self-end rotate-180 leading-none`} style={{ fontSize: size === 'sm' ? '0.6rem' : '0.75rem' }}>
        <div>{card.value}</div>
        <div>{suitSymbol}</div>
      </div>
    </div>
  );
}
