'use client';

import { Card as CardType } from '@/lib/types';
import CardComponent from './Card';
import { confirmPeek } from '@/actions/game';
import { useState } from 'react';

interface PeekOverlayProps {
  gameStateId: string;
  userId: string;
  myCards: CardType[];
  peekConfirmed: string[];
  totalPlayers: number;
  onConfirmed: () => void;
}

export default function PeekOverlay({
  gameStateId,
  userId,
  myCards,
  peekConfirmed,
  totalPlayers,
  onConfirmed,
}: PeekOverlayProps) {
  const [loading, setLoading] = useState(false);
  const alreadyConfirmed = peekConfirmed.includes(userId);
  const confirmedCount = peekConfirmed.length;

  const handleConfirm = async () => {
    setLoading(true);
    await confirmPeek(gameStateId, userId);
    onConfirmed();
    setLoading(false);
  };

  const peekCards = [myCards[2], myCards[3]];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-green-900 border border-green-600 rounded-2xl p-8 max-w-sm w-full mx-4">
        <h2 className="text-2xl font-bold text-yellow-400 text-center mb-2">👀 Peek Your Cards</h2>
        <p className="text-green-300 text-center text-sm mb-6">
          These are your bottom 2 cards. Memorize them before confirming!
        </p>

        <div className="flex justify-center gap-4 mb-6">
          {peekCards.map((card, i) => (
            <div key={i} className="text-center">
              <CardComponent card={card} faceUp={true} size="lg" />
              <p className="text-green-400 text-xs mt-1">Card {i + 3}</p>
            </div>
          ))}
        </div>

        <p className="text-green-500 text-xs text-center mb-4">
          {confirmedCount}/{totalPlayers} players confirmed
        </p>

        <button
          onClick={handleConfirm}
          disabled={loading || alreadyConfirmed}
          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 disabled:text-gray-400 text-green-900 font-bold py-3 rounded-lg transition-colors"
        >
          {alreadyConfirmed ? 'Waiting for others...' : loading ? 'Confirming...' : 'Got it!'}
        </button>
      </div>
    </div>
  );
}
