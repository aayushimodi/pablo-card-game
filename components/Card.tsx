'use client';

import { Card as CardType } from '@/lib/types';

interface CardProps {
  card: CardType | null;
  faceUp?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  selected?: boolean;
  stackable?: boolean;
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

const SIZE_DIMS: Record<string, { w: number; h: number; font: string; pip: string }> = {
  sm: { w: 48,  h: 64,  font: '0.55rem', pip: '1rem' },
  md: { w: 64,  h: 88,  font: '0.75rem', pip: '1.4rem' },
  lg: { w: 80,  h: 112, font: '0.9rem',  pip: '1.8rem' },
};

export default function CardComponent({
  card,
  faceUp = false,
  onClick,
  onDoubleClick,
  selected,
  stackable,
  size = 'md',
  className = '',
}: CardProps) {
  const dims = SIZE_DIMS[size];
  const isClickable = !!onClick || !!onDoubleClick;

  const baseStyle = {
    width: dims.w,
    height: dims.h,
    flexShrink: 0,
  };

  if (!card) {
    return (
      <div
        style={baseStyle}
        className={`rounded-lg border-2 border-dashed border-green-600 ${className}`}
      />
    );
  }

  const showFace = faceUp || card.face_up;

  const borderClass = selected
    ? 'border-yellow-400 shadow-yellow-400 shadow-lg'
    : stackable
    ? 'border-orange-400 shadow-orange-400 shadow-md animate-pulse'
    : 'border-gray-300';

  if (!showFace) {
    return (
      <div
        style={baseStyle}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={`rounded-lg bg-blue-900 border-2 ${
          selected ? 'border-yellow-400 shadow-yellow-400 shadow-lg'
          : stackable ? 'border-orange-400 shadow-orange-400 shadow-md animate-pulse'
          : 'border-blue-700'
        } ${isClickable ? 'cursor-pointer hover:brightness-110 transition-all' : ''} flex items-center justify-center select-none ${className}`}
      >
        <div className="w-full h-full rounded-md bg-gradient-to-br from-blue-800 to-blue-950 flex items-center justify-center">
          <span style={{ fontSize: dims.pip }} className="text-blue-500">🂠</span>
        </div>
      </div>
    );
  }

  const suitSymbol = SUIT_SYMBOLS[card.suit] || '?';
  const suitColor = SUIT_COLORS[card.suit] || 'text-gray-900';

  return (
    <div
      style={baseStyle}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`rounded-lg bg-white border-2 ${borderClass} ${isClickable ? 'cursor-pointer hover:brightness-95 transition-all' : ''} flex flex-col justify-between p-1 select-none ${className}`}
    >
      <div className={`font-bold ${suitColor} leading-none`} style={{ fontSize: dims.font }}>
        <div>{card.value}</div>
        <div>{suitSymbol}</div>
      </div>
      <div className={`font-bold ${suitColor} self-center leading-none`} style={{ fontSize: dims.pip }}>
        {suitSymbol}
      </div>
      <div className={`font-bold ${suitColor} self-end rotate-180 leading-none`} style={{ fontSize: dims.font }}>
        <div>{card.value}</div>
        <div>{suitSymbol}</div>
      </div>
    </div>
  );
}
