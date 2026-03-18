'use client';

import { useState, useEffect } from 'react';
import { Room, GameState, PlayerHand, RoomPlayer } from '@/lib/types';
import { swapCard, drawCard, stackCard } from '@/actions/game';
import GameTable from './GameTable';
import ActionPanel from './ActionPanel';
import PeekOverlay from './PeekOverlay';
import SpecialAbility from './SpecialAbility';
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
  const [stackMsg, setStackMsg] = useState<string | null>(null);
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
        setLogEntries(prev => [...prev, { message: `${playerName}'s turn`, timestamp: Date.now() }]);
      }
      setPrevPhase(gameState.turn_phase);
    }
  }, [gameState.turn_phase, prevPhase, currentPlayer]);

  const handleDrawCard = async () => {
    if (!isMyTurn || gameState.turn_phase !== 'await_draw') return;
    const result = await drawCard(gameState.id, userId);
    if (result.error) setStackMsg(result.error);
    else onRefetch();
  };

  const handleCardClick = async (playerId: string, cardIndex: number) => {
    if (playerId !== userId) return;
    if (!isMyTurn) return;
    if (gameState.turn_phase !== 'holding') return;
    const result = await swapCard(gameState.id, userId, cardIndex);
    if (!result.error) {
      onRefetch();
      setLogEntries(prev => [...prev, { message: `You swapped card ${cardIndex + 1}`, timestamp: Date.now() }]);
    }
  };

  const handleCardDoubleClick = async (cardIndex: number) => {
    if (!gameState.stack_open) return;
    const result = await stackCard(gameState.id, userId, cardIndex);
    if (result.error) {
      setStackMsg(`❌ ${result.error}`);
    } else {
      setStackMsg('✅ Stacked!');
      setLogEntries(prev => [...prev, { message: `You stacked card ${cardIndex + 1}!`, timestamp: Date.now() }]);
      onRefetch();
    }
    setTimeout(() => setStackMsg(null), 2000);
  };

  const isSpecialPhase = ['special_7', 'special_8_pick', 'special_9_pick1', 'special_9_pick2'].includes(gameState.turn_phase);
  const showPeek = gameState.phase === 'peek' && !gameState.peek_confirmed.includes(userId);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-green-800">
      {/* Header */}
      <div className="bg-green-900 border-b border-green-700 px-4 py-2 flex items-center justify-between shrink-0">
        <div>
          <span className="text-green-400 text-xs">Room: </span>
          <span className="text-white text-sm font-bold">{room.code}</span>
        </div>
        <div className="text-center">
          {gameState.phase === 'last_round' && (
            <span className="text-yellow-400 font-bold text-sm">⚡ LAST ROUND!</span>
          )}
          {gameState.pablo_caller_id && (
            <span className="text-orange-400 text-xs ml-2">
              Pablo called by {players.find(p => p.user_id === gameState.pablo_caller_id)?.display_name}!
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

      {/* Stack toast */}
      {stackMsg && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
          {stackMsg}
        </div>
      )}

      <GameTable
        gameState={gameState}
        playerHands={playerHands}
        players={players}
        userId={userId}
        onCardClick={handleCardClick}
        onCardDoubleClick={handleCardDoubleClick}
        onDrawCard={handleDrawCard}
        revealAll={gameState.phase === 'reveal'}
      />

      <div className="px-4 pb-1 shrink-0">
        <GameLog entries={logEntries} />
      </div>

      <ActionPanel
        gameState={gameState}
        userId={userId}
        isMyTurn={isMyTurn}
        onAction={onRefetch}
        players={players}
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
    </div>
  );
}
