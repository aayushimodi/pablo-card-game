'use client';

import { useState, useEffect } from 'react';
import { Room, GameState, PlayerHand, RoomPlayer } from '@/lib/types';
import { swapCard } from '@/actions/game';
import GameTable from './GameTable';
import ActionPanel from './ActionPanel';
import PeekOverlay from './PeekOverlay';
import SpecialAbility from './SpecialAbility';
import StackOverlay from './StackOverlay';
import GameLog from './GameLog';

interface GameProps {
  room: Room;
  players: RoomPlayer[];
  gameState: GameState;
  playerHands: PlayerHand[];
  userId: string;
  onRefetch: () => void;
}

interface LogEntry {
  message: string;
  timestamp: number;
}

export default function Game({
  room,
  players,
  gameState,
  playerHands,
  userId,
  onRefetch,
}: GameProps) {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [showStack, setShowStack] = useState(false);
  const [prevPhase, setPrevPhase] = useState(gameState.turn_phase);

  const currentPlayer = players.find(
    p => p.user_id === gameState.players_order[gameState.current_player_index]
  );
  const isMyTurn = gameState.players_order[gameState.current_player_index] === userId;

  const myHand = playerHands.find(ph => ph.user_id === userId);
  const myCards = myHand?.cards || [];

  useEffect(() => {
    if (prevPhase !== gameState.turn_phase) {
      const playerName = currentPlayer?.display_name || 'Unknown';
      if (gameState.turn_phase === 'await_draw') {
        setLogEntries(prev => [...prev, {
          message: `${playerName}'s turn`,
          timestamp: Date.now(),
        }]);
      }
      setPrevPhase(gameState.turn_phase);
    }
  }, [gameState.turn_phase, prevPhase, currentPlayer]);

  useEffect(() => {
    if (gameState.stack_open && !isMyTurn) {
      setShowStack(true);
    } else if (!gameState.stack_open) {
      setShowStack(false);
    }
  }, [gameState.stack_open, isMyTurn]);

  const handleCardClick = async (playerId: string, cardIndex: number) => {
    if (playerId !== userId) return;
    if (!isMyTurn) return;
    if (gameState.turn_phase !== 'holding') return;

    const result = await swapCard(gameState.id, userId, cardIndex);
    if (!result.error) {
      onRefetch();
      setLogEntries(prev => [...prev, {
        message: `You swapped card ${cardIndex + 1}`,
        timestamp: Date.now(),
      }]);
    }
  };

  const isSpecialPhase = ['special_7', 'special_8_pick', 'special_9_pick1', 'special_9_pick2'].includes(gameState.turn_phase);
  const showPeek = gameState.phase === 'peek' && !gameState.peek_confirmed.includes(userId);

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <div className="bg-green-900 border-b border-green-700 px-4 py-2 flex items-center justify-between">
        <div>
          <span className="text-green-400 text-xs">Room: </span>
          <span className="text-white text-sm font-bold">{room.code}</span>
        </div>
        <div className="text-center">
          {gameState.phase === 'last_round' && (
            <span className="text-yellow-400 font-bold text-sm">⚡ LAST ROUND!</span>
          )}
          {gameState.pablo_caller_id && (
            <span className="text-red-400 text-xs ml-2">
              Pablo called by {players.find(p => p.user_id === gameState.pablo_caller_id)?.display_name}
            </span>
          )}
        </div>
        <div>
          <span className="text-green-400 text-xs">Turn: </span>
          <span className="text-white text-sm font-bold">
            {isMyTurn ? '⭐ You' : currentPlayer?.display_name}
          </span>
        </div>
      </div>

      <GameTable
        gameState={gameState}
        playerHands={playerHands}
        players={players}
        userId={userId}
        onCardClick={handleCardClick}
        revealAll={gameState.phase === 'reveal'}
      />

      <div className="px-4 pb-2">
        <GameLog entries={logEntries} />
      </div>

      <ActionPanel
        gameState={gameState}
        userId={userId}
        isMyTurn={isMyTurn}
        onAction={onRefetch}
      />

      {showPeek && (
        <PeekOverlay
          gameStateId={gameState.id}
          userId={userId}
          myCards={myCards}
          peekConfirmed={gameState.peek_confirmed}
          totalPlayers={gameState.players_order.length}
          onConfirmed={onRefetch}
        />
      )}

      {isMyTurn && isSpecialPhase && (
        <SpecialAbility
          gameState={gameState}
          playerHands={playerHands}
          players={players}
          userId={userId}
          onDone={onRefetch}
        />
      )}

      {showStack && gameState.stack_open && (
        <StackOverlay
          gameState={gameState}
          playerHands={playerHands}
          players={players}
          userId={userId}
          onDone={() => {
            setShowStack(false);
            onRefetch();
          }}
        />
      )}
    </div>
  );
}
