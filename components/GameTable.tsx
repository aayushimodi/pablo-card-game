'use client';

import { GameState, PlayerHand, RoomPlayer } from '@/lib/types';
import CardComponent from './Card';
import PlayerGrid from './PlayerGrid';

interface GameTableProps {
  gameState: GameState;
  playerHands: PlayerHand[];
  players: RoomPlayer[];
  userId: string;
  onCardClick?: (playerId: string, cardIndex: number) => void;
  selectedCard?: { playerId: string; cardIndex: number } | null;
  revealAll?: boolean;
}

export default function GameTable({
  gameState,
  playerHands,
  players,
  userId,
  onCardClick,
  selectedCard,
  revealAll,
}: GameTableProps) {
  const topDiscard = gameState.discard_pile[gameState.discard_pile.length - 1];
  const currentPlayerId = gameState.players_order[gameState.current_player_index];

  return (
    <div className="flex-1 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-6 z-10">
        <div className="flex flex-col items-center">
          <p className="text-green-400 text-xs mb-1">Deck ({gameState.deck.length})</p>
          <div className="w-16 rounded-lg bg-blue-900 border-2 border-blue-700 flex items-center justify-center" style={{ height: '5.5rem' }}>
            <span className="text-blue-400 text-sm font-bold">{gameState.deck.length}</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-green-400 text-xs mb-1">Discard</p>
          <CardComponent card={topDiscard} faceUp={true} size="md" />
        </div>
      </div>

      <div className="h-full p-4 flex flex-wrap gap-4 items-start justify-around pt-8">
        {players.map((player) => {
          const hand = playerHands.find(ph => ph.user_id === player.user_id);
          const cards = hand?.cards || [];
          const isCurrentPlayer = player.user_id === currentPlayerId;
          const isMe = player.user_id === userId;

          return (
            <div
              key={player.id}
              className={`flex flex-col items-center p-2 ${
                isCurrentPlayer ? 'ring-2 ring-yellow-400 rounded-xl' : ''
              }`}
            >
              <p className={`text-xs font-bold mb-1 ${isMe ? 'text-yellow-400' : 'text-white'}`}>
                {player.display_name} {isMe ? '(you)' : ''}
                {isCurrentPlayer && ' 🎯'}
              </p>
              <PlayerGrid
                cards={cards}
                isCurrentPlayer={isCurrentPlayer}
                isMyHand={isMe}
                onCardClick={
                  onCardClick
                    ? (cardIndex) => onCardClick(player.user_id, cardIndex)
                    : undefined
                }
                selectedCard={
                  selectedCard?.playerId === player.user_id
                    ? selectedCard.cardIndex
                    : undefined
                }
                revealAll={revealAll}
                size="sm"
              />
              {player.wins > 0 && (
                <p className="text-yellow-400 text-xs mt-1">🏆 {player.wins}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
