'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom, joinRoom } from '@/actions/room';

export default function Home() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!displayName.trim()) return setError('Please enter your name');
    setLoading(true);
    setError('');
    try {
      const result = await createRoom(displayName.trim());
      if (result.error) {
        setError(result.error);
      } else {
        localStorage.setItem('pablo_user_id', result.userId);
        localStorage.setItem('pablo_display_name', displayName.trim());
        router.push(`/room/${result.roomCode}`);
      }
    } catch {
      setError('Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!displayName.trim()) return setError('Please enter your name');
    if (!roomCode.trim()) return setError('Please enter room code');
    setLoading(true);
    setError('');
    try {
      const result = await joinRoom(roomCode.trim(), displayName.trim());
      if (result.error) {
        setError(result.error);
      } else {
        localStorage.setItem('pablo_user_id', result.userId);
        localStorage.setItem('pablo_room_id', result.roomId);
        localStorage.setItem('pablo_display_name', displayName.trim());
        router.push(`/room/${roomCode.trim().toUpperCase()}`);
      }
    } catch {
      setError('Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-green-900 border border-green-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-4xl font-bold text-center text-yellow-400 mb-2">🃏 Pablo</h1>
        <p className="text-green-300 text-center mb-8 text-sm">The multiplayer card game</p>

        {mode === 'home' && (
          <div className="space-y-4">
            <div>
              <label className="block text-green-300 text-sm mb-1">Your Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-green-800 border border-green-600 rounded-lg px-4 py-2 text-white placeholder-green-500 focus:outline-none focus:border-yellow-400"
                maxLength={20}
              />
            </div>
            <button
              onClick={() => setMode('create')}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-green-900 font-bold py-3 rounded-lg transition-colors"
            >
              Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors border border-green-500"
            >
              Join Room
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-yellow-400">Create a Room</h2>
            <div>
              <label className="block text-green-300 text-sm mb-1">Your Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-green-800 border border-green-600 rounded-lg px-4 py-2 text-white placeholder-green-500 focus:outline-none focus:border-yellow-400"
                maxLength={20}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-700 text-green-900 font-bold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
            <button
              onClick={() => { setMode('home'); setError(''); }}
              className="w-full text-green-400 hover:text-white text-sm transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-yellow-400">Join a Room</h2>
            <div>
              <label className="block text-green-300 text-sm mb-1">Your Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-green-800 border border-green-600 rounded-lg px-4 py-2 text-white placeholder-green-500 focus:outline-none focus:border-yellow-400"
                maxLength={20}
              />
            </div>
            <div>
              <label className="block text-green-300 text-sm mb-1">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                className="w-full bg-green-800 border border-green-600 rounded-lg px-4 py-2 text-white placeholder-green-500 focus:outline-none focus:border-yellow-400 uppercase tracking-widest"
                maxLength={6}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-700 text-green-900 font-bold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
            <button
              onClick={() => { setMode('home'); setError(''); }}
              className="w-full text-green-400 hover:text-white text-sm transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-green-700">
          <h3 className="text-green-400 font-bold mb-2 text-sm">How to Play</h3>
          <ul className="text-green-500 text-xs space-y-1">
            <li>• Each player gets 4 cards in a 2×2 grid</li>
            <li>• Peek your bottom 2 cards at start</li>
            <li>• Draw and swap/discard to lower your sum</li>
            <li>• 7=peek own, 8=peek opponent, 9=swap any two</li>
            <li>• Call &quot;Pablo&quot; when you think you have the lowest sum!</li>
            <li>• Lowest total wins 🏆</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
