'use client';

import { GameState } from '@/lib/types';
import { drawCard, discardDrawnCard, callPablo, endTurn } from '@/actions/game';
import { useState } from 'react';
import CardComponent from './Card';

interface ActionPanelProps {
  gameState: GameState;
  userId: string;
  isMyTurn: boolean;
  onAction: () => void;
}

export default function ActionPanel({
  gameState,
  userId,
  isMyTurn,
  onAction,
}: ActionPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topDiscard = gameState.discard_pile[gameState.discard_pile.length - 1];

  const handleDraw = async () => {
    setLoading(true);
    setError('');
    const result = await drawCard(gameState.id, userId);
    if (result.error) setError(result.error);
    onAction();
    setLoading(false);
  };

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
    <div className="bg-green-900 border-t border-green-700 p-4">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex flex-col items-center">
          <p className="text-green-400 text-xs mb-1">Discard</p>
          <CardComponent card={topDiscard} faceUp={true} size="md" />
        </div>

        {gameState.drawn_card && isMyTurn && (
          <div className="flex flex-col items-center">
            <p className="text-yellow-400 text-xs mb-1">In Hand</p>
            <CardComponent card={gameState.drawn_card} faceUp={true} size="md" />
          </div>
        )}

        <div className="flex flex-col gap-2 flex-1 max-w-xs">
          {error && <p className="text-red-400 text-xs">{error}</p>}

          {!isMyTurn && (
            <p className="text-green-400 text-sm text-center">Waiting for other player...</p>
          )}

          {isMyTurn && gameState.turn_phase === 'await_draw' && (
            <button
              onClick={handleDraw}
              disabled={loading}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 text-green-900 font-bold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Drawing...' : '🃏 Draw Card'}
            </button>
          )}

          {isMyTurn && gameState.turn_phase === 'holding' && (
            <>
              <button
                onClick={handleDiscard}
                disabled={loading}
                className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
              >
                {loading ? '...' : '🗑️ Discard Drawn'}
              </button>
              <p className="text-green-400 text-xs text-center">Or click a card in your grid to swap</p>
            </>
          )}

          {isMyTurn && gameState.turn_phase === 'post_action' && (
            <>
              <button
                onClick={handlePablo}
                disabled={loading}
                className="bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 text-green-900 font-bold py-2 px-4 rounded-lg text-sm transition-colors"
              >
                {loading ? '...' : '🎯 Call Pablo!'}
              </button>
              <button
                onClick={handleEndTurn}
                disabled={loading}
                className="bg-green-700 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
              >
                {loading ? '...' : '✓ End Turn'}
              </button>
            </>
          )}

          {isMyTurn && (gameState.turn_phase === 'special_7' || gameState.turn_phase === 'special_8_pick' || gameState.turn_phase === 'special_9_pick1' || gameState.turn_phase === 'special_9_pick2') && (
            <p className="text-yellow-400 text-sm text-center">Use your special ability...</p>
          )}
        </div>
      </div>
    </div>
  );
}
