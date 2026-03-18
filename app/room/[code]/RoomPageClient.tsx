'use client';

import { useEffect, useState } from 'react';
import { useGameRealtime } from '@/hooks/useGameRealtime';
import Lobby from '@/components/Lobby';
import Game from '@/components/Game';
import Leaderboard from '@/components/Leaderboard';

interface RoomPageClientProps {
  code: string;
}

export default function RoomPageClient({ code }: RoomPageClientProps) {
  const [userId, setUserId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedUserId = localStorage.getItem('pablo_user_id') || '';
    const storedRoomId = localStorage.getItem('pablo_room_id') || '';
    setUserId(storedUserId);
    setRoomId(storedRoomId);
  }, []);

  const { room, players, gameState, playerHands, loading, refetch } = useGameRealtime(
    roomId,
    code
  );

  useEffect(() => {
    if (!loading && room && roomId !== room.id) {
      setRoomId(room.id);
    }
  }, [room, loading, roomId]);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Room not found</div>
      </div>
    );
  }

  if (room.status === 'lobby') {
    return (
      <Lobby
        room={room}
        players={players}
        userId={userId}
        onRefetch={refetch}
      />
    );
  }

  if (room.status === 'finished') {
    return (
      <Leaderboard
        players={players}
        playerHands={playerHands}
        gameState={gameState}
        room={room}
        userId={userId}
        onNewRound={refetch}
      />
    );
  }

  if (room.status === 'playing' && gameState) {
    return (
      <Game
        room={room}
        players={players}
        gameState={gameState}
        playerHands={playerHands}
        userId={userId}
        onRefetch={refetch}
      />
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-white text-xl">Loading game...</div>
    </div>
  );
}
