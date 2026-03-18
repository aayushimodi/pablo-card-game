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
  onCardDoubleClick?: (cardIndex: number) => void;
  onDrawCard?: () => void;
  selectedCard?: { playerId: string; cardIndex: number } | null;
  revealAll?: boolean;
}

export default function GameTable({
  gameState,
  playerHands,
  players,
  userId,
  onCardClick,
  onCardDoubleClick,
  onDrawCard,
  selectedCard,
  revealAll,
}: GameTableProps) {
  const topDiscard = gameState.discard_pile[gameState.discard_pile.length - 1];
  const currentPlayerId = gameState.players_order[gameState.current_player_index];
  const isMyTurn = currentPlayerId === userId;
  const canDraw = isMyTurn && gameState.turn_phase === 'await_draw';

  const me = players.find(p => p.user_id === userId);
  const opponents = players.filter(p => p.user_id !== userId);

  const myHand = playerHands.find(ph => ph.user_id === userId);
  const myCards = myHand?.cards || [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">

      {/* ── Opponents (top area) ─────────────────────────────── */}
      <div className="flex flex-wrap justify-center gap-6 px-4 pt-4 pb-2">
        {opponents.map((player) => {
          const hand = playerHands.find(ph => ph.user_id === player.user_id);
          const cards = hand?.cards || [];
          const isActive = player.user_id === currentPlayerId;

          return (
            <div key={player.id} className="flex flex-col items-center gap-1">
              <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? 'bg-yellow-400 text-green-900' : 'text-green-300'}`}>
                {player.display_name} {player.wins > 0 && `🏆${player.wins}`} {isActive && '🎯'}
              </div>
              <PlayerGrid
                cards={cards}
                isCurrentPlayer={isActive}
                isMyHand={false}
                onCardClick={onCardClick ? (i) => onCardClick(player.user_id, i) : undefined}
                selectedCard={selectedCard?.playerId === player.user_id ? selectedCard.cardIndex : undefined}
                revealAll={revealAll}
                size="sm"
              />
            </div>
          );
        })}
      </div>

      {/* ── Center: deck + discard ───────────────────────────── */}
      <div className="flex justify-center items-center gap-8 py-4">

        {/* Deck */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-green-400 text-xs">Deck ({gameState.deck.length})</span>
          <div
            onClick={canDraw ? onDrawCard : undefined}
            className={`relative rounded-xl border-2 flex items-center justify-center select-none transition-all
              ${canDraw
                ? 'border-yellow-400 shadow-yellow-400 shadow-lg cursor-pointer hover:scale-105 hover:brightness-110 animate-pulse'
                : 'border-blue-700 cursor-default'}
            `}
            style={{ width: 64, height: 88, background: 'linear-gradient(135deg, #1e3a5f, #0f2040)' }}
          >
            <span className="text-blue-400 font-bold text-lg">{gameState.deck.length}</span>
            {canDraw && (
              <span className="absolute -top-5 text-yellow-400 text-xs font-bold whitespace-nowrap">tap to draw</span>
            )}
          </div>
        </div>

        {/* Discard */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-green-400 text-xs">Discard</span>
          <CardComponent card={topDiscard ?? null} faceUp={true} size="md" />
        </div>

        {/* Drawn card (only visible to active player) */}
        {isMyTurn && gameState.drawn_card && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-yellow-400 text-xs font-bold">In hand</span>
            <CardComponent card={gameState.drawn_card} faceUp={true} size="md" className="ring-2 ring-yellow-400" />
          </div>
        )}
      </div>

      {/* ── My cards (bottom center) ─────────────────────────── */}
      <div className="flex justify-center pb-4">
        <div className="flex flex-col items-center gap-1">
          <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${me?.user_id === currentPlayerId ? 'bg-yellow-400 text-green-900' : 'text-yellow-300'}`}>
            {me?.display_name ?? 'You'} (you){me && me.wins > 0 ? ` 🏆${me.wins}` : ''}{me?.user_id === currentPlayerId ? ' 🎯' : ''}
          </div>
          {gameState.stack_open && (
            <p className="text-green-500 text-xs">Double-click a card to stack</p>
          )}
          <PlayerGrid
            cards={myCards}
            isCurrentPlayer={me?.user_id === currentPlayerId}
            isMyHand={true}
            onCardClick={onCardClick ? (i) => onCardClick(userId, i) : undefined}
            onCardDoubleClick={onCardDoubleClick}
            selectedCard={selectedCard?.playerId === userId ? selectedCard.cardIndex : undefined}
            revealAll={revealAll}
            size="md"
          />
        </div>
      </div>
    </div>
  );
}
