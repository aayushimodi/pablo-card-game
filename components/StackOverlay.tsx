'use client';

import { GameState, PlayerHand, RoomPlayer } from '@/lib/types';
import { stackCard } from '@/actions/game';
import { useState } from 'react';
import CardComponent from './Card';

interface StackOverlayProps {
  gameState: GameState;
  playerHands: PlayerHand[];
  players: RoomPlayer[];
  userId: string;
  onDone: () => void;
}

export default function StackOverlay({
  gameState,
  playerHands,
  players: _players,
  userId,
  onDone,
}: StackOverlayProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topDiscard = gameState.discard_pile[gameState.discard_pile.length - 1];
  const myHand = playerHands.find(ph => ph.user_id === userId);
  const myCards = myHand?.cards || [];

  const handleStackOwn = async (cardIndex: number) => {
    setLoading(true);
    const result = await stackCard(gameState.id, userId, cardIndex, userId);
    if (result.error) setError(result.error);
    else onDone();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-green-900 border border-green-600 rounded-2xl p-6 max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold text-yellow-400 mb-2">🃏 Stack a Card!</h2>
        <p className="text-green-300 text-sm mb-4">
          The discard is a <strong>{topDiscard?.value} of {topDiscard?.suit}</strong>. 
          Play a matching card to stack it! Wrong guess = draw a penalty card.
        </p>

        <div className="mb-4">
          <p className="text-green-400 text-xs mb-2">Your cards:</p>
          <div className="grid grid-cols-4 gap-2">
            {myCards.map((card, i) => (
              <CardComponent
                key={i}
                card={card}
                faceUp={false}
                onClick={() => handleStackOwn(i)}
                size="sm"
              />
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button
          onClick={onDone}
          disabled={loading}
          className="w-full text-green-400 hover:text-white text-sm transition-colors"
        >
          Pass (don&apos;t stack)
        </button>
      </div>
    </div>
  );
}
