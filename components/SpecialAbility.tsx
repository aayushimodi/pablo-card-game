'use client';

import { Card as CardType, GameState, PlayerHand, RoomPlayer } from '@/lib/types';
import { useSpecial7, pickSpecial8Target, pickSpecial9First, pickSpecial9Second } from '@/actions/game';
import { useState } from 'react';
import CardComponent from './Card';

interface SpecialAbilityProps {
  gameState: GameState;
  playerHands: PlayerHand[];
  players: RoomPlayer[];
  userId: string;
  onDone: () => void;
}

export default function SpecialAbility({
  gameState,
  playerHands,
  players,
  userId,
  onDone,
}: SpecialAbilityProps) {
  const [peekedCard, setPeekedCard] = useState<CardType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const myHand = playerHands.find(ph => ph.user_id === userId);
  const myCards = myHand?.cards || [];

  const handleSpecial7Card = async (cardIndex: number) => {
    setLoading(true);
    const result = await useSpecial7(gameState.id, userId, cardIndex);
    if (result.error) {
      setError(result.error);
    } else if (result.card) {
      setPeekedCard(result.card);
    }
    setLoading(false);
  };

  const handleSpecial8Pick = async (targetUserId: string, cardIndex: number) => {
    setLoading(true);
    const result = await pickSpecial8Target(gameState.id, userId, targetUserId, cardIndex);
    if (result.error) {
      setError(result.error);
    } else if (result.card) {
      setPeekedCard(result.card);
    }
    setLoading(false);
  };

  const handleSpecial9First = async (targetUserId: string, cardIndex: number) => {
    setLoading(true);
    const result = await pickSpecial9First(gameState.id, userId, targetUserId, cardIndex);
    if (result.error) {
      setError(result.error);
    } else {
      onDone();
    }
    setLoading(false);
  };

  const handleSpecial9Second = async (targetUserId: string, cardIndex: number) => {
    if (!gameState.special_9_first_pick) return;
    setLoading(true);
    const result = await pickSpecial9Second(gameState.id, userId, targetUserId, cardIndex);
    if (result.error) {
      setError(result.error);
    } else {
      onDone();
    }
    setLoading(false);
  };

  const turnPhase = gameState.turn_phase;

  if (peekedCard) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-green-900 border border-green-600 rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">👀 Peeked Card</h2>
          <div className="flex justify-center mb-6">
            <CardComponent card={peekedCard} faceUp={true} size="lg" />
          </div>
          <button
            onClick={onDone}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-green-900 font-bold py-3 rounded-lg"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-green-900 border border-green-600 rounded-2xl p-6 max-w-lg w-full mx-4">
        {turnPhase === 'special_7' && (
          <>
            <h2 className="text-xl font-bold text-yellow-400 mb-2">7️⃣ Peek Your Card</h2>
            <p className="text-green-300 text-sm mb-4">Select one of your cards to peek at</p>
            <div className="flex justify-center">
              <div className="grid grid-cols-2 gap-2">
                {myCards.map((card, i) => (
                  <CardComponent
                    key={i}
                    card={card}
                    faceUp={false}
                    onClick={() => handleSpecial7Card(i)}
                    size="md"
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {turnPhase === 'special_8_pick' && (
          <>
            <h2 className="text-xl font-bold text-yellow-400 mb-2">8️⃣ Peek Opponent&apos;s Card</h2>
            <p className="text-green-300 text-sm mb-4">Select a player and card to peek at</p>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {players.filter(p => p.user_id !== userId).map(player => {
                const hand = playerHands.find(ph => ph.user_id === player.user_id);
                return (
                  <div key={player.id} className="bg-green-800 rounded-lg p-3">
                    <p className="text-white text-sm font-bold mb-2">{player.display_name}</p>
                    <div className="grid grid-cols-4 gap-1">
                      {(hand?.cards || []).map((card, i) => (
                        <CardComponent
                          key={i}
                          card={card}
                          faceUp={false}
                          onClick={() => handleSpecial8Pick(player.user_id, i)}
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {(turnPhase === 'special_9_pick1' || turnPhase === 'special_9_pick2') && (
          <>
            <h2 className="text-xl font-bold text-yellow-400 mb-2">9️⃣ Swap Cards</h2>
            <p className="text-green-300 text-sm mb-4">
              {turnPhase === 'special_9_pick1'
                ? 'Pick the FIRST card to swap (from any player, including yourself)'
                : 'Pick the SECOND card to swap it with'}
            </p>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {players.map(player => {
                const hand = playerHands.find(ph => ph.user_id === player.user_id);
                const isMe = player.user_id === userId;
                return (
                  <div key={player.id} className="bg-green-800 rounded-lg p-3">
                    <p className="text-white text-sm font-bold mb-2">
                      {player.display_name} {isMe ? '(you)' : ''}
                    </p>
                    <div className="grid grid-cols-4 gap-1">
                      {(hand?.cards || []).map((card, i) => {
                        const isFirstPick =
                          turnPhase === 'special_9_pick2' &&
                          gameState.special_9_first_pick?.player_id === player.user_id &&
                          gameState.special_9_first_pick?.card_index === i;
                        return (
                          <CardComponent
                            key={i}
                            card={card}
                            faceUp={isMe}
                            selected={isFirstPick}
                            onClick={() => {
                              if (turnPhase === 'special_9_pick1') {
                                handleSpecial9First(player.user_id, i);
                              } else {
                                handleSpecial9Second(player.user_id, i);
                              }
                            }}
                            size="sm"
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <button
          onClick={onDone}
          className="mt-4 w-full text-green-400 hover:text-white text-sm transition-colors"
          disabled={loading}
        >
          Skip / Cancel
        </button>
      </div>
    </div>
  );
}
