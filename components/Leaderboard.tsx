'use client';

import { Room, RoomPlayer, GameState, PlayerHand } from '@/lib/types';
import { handSum } from '@/lib/game-logic';
import { startNewRound } from '@/actions/game';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LeaderboardProps {
  players: RoomPlayer[];
  playerHands: PlayerHand[];
  gameState: GameState | null;
  room: Room;
  userId: string;
  onNewRound: () => void;
}

export default function Leaderboard({ players, playerHands, gameState, room, userId, onNewRound }: LeaderboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isHost = room.host_user_id === userId;

  const handSums = playerHands.map(ph => {
    const player = players.find(p => p.user_id === ph.user_id);
    return {
      player,
      sum: handSum(ph.cards),
      cards: ph.cards,
    };
  }).sort((a, b) => a.sum - b.sum);

  const minSum = handSums[0]?.sum ?? Infinity;

  const handleNewRound = async () => {
    setLoading(true);
    await startNewRound(room.id, userId);
    onNewRound();
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-green-900 border border-green-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-bold text-yellow-400 text-center mb-2">🏆 Round Over!</h1>
        
        {gameState?.pablo_caller_id && (
          <p className="text-center text-green-300 mb-4 text-sm">
            Pablo called by {players.find(p => p.user_id === gameState.pablo_caller_id)?.display_name}
          </p>
        )}

        <div className="space-y-3 mb-6">
          {handSums.map(({ player, sum }, i) => (
            <div
              key={player?.id}
              className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                sum === minSum ? 'bg-yellow-500 text-green-900' : 'bg-green-800 text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg">{i + 1}.</span>
                <div>
                  <span className="font-bold">{player?.display_name}</span>
                  {player?.user_id === userId && <span className="text-xs ml-1">(you)</span>}
                  <div className="text-xs opacity-70">🏆 {player?.wins ?? 0} wins</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-2xl">{sum}</div>
                {sum === minSum && <div className="text-xs font-bold">WINNER!</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <h3 className="text-green-400 text-sm font-bold mb-2">All-Time Wins</h3>
          <div className="space-y-1">
            {[...players].sort((a, b) => b.wins - a.wins).map(p => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="text-white">{p.display_name}</span>
                <span className="text-yellow-400">🏆 {p.wins}</span>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button
            onClick={handleNewRound}
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 text-green-900 font-bold py-3 rounded-lg transition-colors mb-3"
          >
            {loading ? 'Starting...' : 'Play Again'}
          </button>
        ) : (
          <div className="bg-green-800 rounded-lg p-3 text-center mb-3">
            <p className="text-green-400 text-sm">Waiting for host to start next round...</p>
          </div>
        )}

        <button
          onClick={() => router.push('/')}
          className="w-full text-green-400 hover:text-white text-sm transition-colors"
        >
          Leave
        </button>
      </div>
    </div>
  );
}
