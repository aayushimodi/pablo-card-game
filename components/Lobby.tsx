'use client';

import { useState } from 'react';
import { Room, RoomPlayer } from '@/lib/types';
import { startGame } from '@/actions/game';
import { leaveRoom } from '@/actions/room';
import { useRouter } from 'next/navigation';

interface LobbyProps {
  room: Room;
  players: RoomPlayer[];
  userId: string;
  onRefetch: () => void;
}

export default function Lobby({ room, players, userId, onRefetch }: LobbyProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const isHost = room.host_user_id === userId;

  const handleStart = async () => {
    setLoading(true);
    setError('');
    const result = await startGame(room.id, userId);
    if (result.error) {
      setError(result.error);
    } else {
      onRefetch();
    }
    setLoading(false);
  };

  const handleLeave = async () => {
    await leaveRoom(room.id, userId);
    localStorage.removeItem('pablo_room_id');
    router.push('/');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-green-900 border border-green-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-bold text-yellow-400 text-center mb-6">🃏 Pablo Lobby</h1>

        <div className="bg-green-800 rounded-xl p-4 mb-6 text-center">
          <p className="text-green-400 text-sm mb-1">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-bold text-white tracking-widest">{room.code}</span>
            <button
              onClick={copyCode}
              className="text-green-400 hover:text-white transition-colors text-sm"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
          <p className="text-green-500 text-xs mt-1">Share this code with friends</p>
        </div>

        <div className="mb-6">
          <h2 className="text-green-300 font-bold mb-3">Players ({players.length}/8)</h2>
          <div className="space-y-2">
            {players.map(player => (
              <div
                key={player.id}
                className="flex items-center justify-between bg-green-800 rounded-lg px-4 py-2"
              >
                <span className="text-white font-medium">{player.display_name}</span>
                <div className="flex items-center gap-2">
                  {player.wins > 0 && (
                    <span className="text-yellow-400 text-sm">🏆 {player.wins}</span>
                  )}
                  {room.host_user_id === player.user_id && (
                    <span className="text-yellow-400 text-xs bg-yellow-900 px-2 py-0.5 rounded">HOST</span>
                  )}
                  {player.user_id === userId && (
                    <span className="text-green-400 text-xs">(you)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {isHost ? (
          <button
            onClick={handleStart}
            disabled={loading || players.length < 2}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 disabled:text-gray-400 text-green-900 font-bold py-3 rounded-lg transition-colors mb-3"
          >
            {loading ? 'Starting...' : players.length < 2 ? 'Need 2+ players' : 'Start Game'}
          </button>
        ) : (
          <div className="bg-green-800 rounded-lg p-3 text-center mb-3">
            <p className="text-green-400 text-sm">Waiting for host to start...</p>
          </div>
        )}

        <button
          onClick={handleLeave}
          className="w-full text-green-400 hover:text-white text-sm transition-colors"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}
