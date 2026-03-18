'use client';

import { GameState, RoomPlayer } from '@/lib/types';
import { discardDrawnCard, callPablo, endTurn } from '@/actions/game';
import { useState } from 'react';

interface ActionPanelProps {
  gameState: GameState;
  userId: string;
  isMyTurn: boolean;
  onAction: () => void;
  players?: RoomPlayer[];
}

export default function ActionPanel({
  gameState,
  userId,
  isMyTurn,
  onAction,
  players,
}: ActionPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDiscard = async () => {
    setLoading(true);
    setError('');
    const result = await discardDrawnCard(gameState.id, userId);
    if (result.error) setError(result.error);
    onAction();
    setLoading(false);
  };

  const handlePablo = async () => {
    setLoading(true);
    setError('');
    const result = await callPablo(gameState.id, userId);
    if (result.error) setError(result.error);
    onAction();
    setLoading(false);
  };

  const handleEndTurn = async () => {
    setLoading(true);
    setError('');
    const result = await endTurn(gameState.id, userId);
    if (result.error) setError(result.error);
    onAction();
    setLoading(false);
  };

  return (
    <div className="bg-green-900 border-t border-green-700 px-4 py-3 shrink-0">
      <div className="flex items-center justify-between gap-4">

        {/* Status text */}
        <div className="flex-1 text-sm">
          {!isMyTurn && (
            <p className="text-green-400">Waiting for {players?.find?.((p: {user_id:string}) => p.user_id === gameState.players_order[gameState.current_player_index])?.display_name ?? 'other player'}...</p>
          )}
          {isMyTurn && gameState.turn_phase === 'await_draw' && (
            <p className="text-yellow-400 font-bold">Your turn — tap the deck to draw</p>
          )}
          {isMyTurn && gameState.turn_phase === 'holding' && (
            <p className="text-yellow-400 font-bold">Tap a card to swap, or discard below</p>
          )}
          {isMyTurn && gameState.turn_phase === 'post_action' && (
            <p className="text-yellow-400 font-bold">Call Pablo or end turn</p>
          )}
          {isMyTurn && (gameState.turn_phase === 'special_7' || gameState.turn_phase === 'special_8_pick' || gameState.turn_phase === 'special_9_pick1' || gameState.turn_phase === 'special_9_pick2') && (
            <p className="text-purple-400 font-bold">Use your special ability ✨</p>
          )}
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        {/* Drawn card + discard button */}
        {isMyTurn && gameState.drawn_card && gameState.turn_phase === 'holding' && (
          <button
            onClick={handleDiscard}
            disabled={loading}
            className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            {loading ? '...' : '🗑️ Discard'}
          </button>
        )}

        {/* Pablo + End Turn */}
        {isMyTurn && gameState.turn_phase === 'post_action' && (
          <div className="flex gap-2">
            <button
              onClick={handlePablo}
              disabled={loading}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 text-green-900 font-bold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {loading ? '...' : '🎯 Pablo!'}
            </button>
            <button
              onClick={handleEndTurn}
              disabled={loading}
              className="bg-green-700 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {loading ? '...' : '✓ End Turn'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
