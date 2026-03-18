'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { GameState, PlayerHand, Room, RoomPlayer } from '@/lib/types';

interface RealtimeData {
  room: Room | null;
  players: RoomPlayer[];
  gameState: GameState | null;
  playerHands: PlayerHand[];
}

export function useGameRealtime(roomId: string, roomCode: string) {
  const [data, setData] = useState<RealtimeData>({
    room: null,
    players: [],
    gameState: null,
    playerHands: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const supabase = createClient();
    
    const [{ data: room }, { data: players }, { data: gameStates }, { data: hands }] = await Promise.all([
      supabase.from('rooms').select('*').eq('code', roomCode).single(),
      supabase.from('room_players').select('*').eq('room_id', roomId).order('seat_index'),
      supabase.from('game_states').select('*').eq('room_id', roomId).single(),
      supabase.from('player_hands').select('*').eq('room_id', roomId),
    ]);
    
    setData({
      room: room || null,
      players: players || [],
      gameState: gameStates || null,
      playerHands: hands || [],
    });
    setLoading(false);
  }, [roomId, roomCode]);

  useEffect(() => {
    if (!roomId) return;
    
    fetchAll();
    
    const supabase = createClient();
    
    const channel = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_states', filter: `room_id=eq.${roomId}` }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_hands', filter: `room_id=eq.${roomId}` }, () => fetchAll())
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchAll]);

  return { ...data, loading, refetch: fetchAll };
}
