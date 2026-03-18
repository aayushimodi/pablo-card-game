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

  const fetchAll = useCallback(async (overrideRoomId?: string) => {
    const supabase = createClient();
    const effectiveRoomId = overrideRoomId || roomId;

    // Fetch room by code first (always works without roomId)
    const { data: room } = await supabase.from('rooms').select('*').eq('code', roomCode).single();
    const resolvedRoomId = effectiveRoomId || room?.id || '';

    if (!resolvedRoomId) {
      setData({ room: room || null, players: [], gameState: null, playerHands: [] });
      setLoading(false);
      return;
    }

    const [{ data: players }, { data: gameStates }, { data: hands }] = await Promise.all([
      supabase.from('room_players').select('*').eq('room_id', resolvedRoomId).order('seat_index'),
      supabase.from('game_states').select('*').eq('room_id', resolvedRoomId).single(),
      supabase.from('player_hands').select('*').eq('room_id', resolvedRoomId),
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
    fetchAll();
    
    if (!roomId) return; // Can't subscribe without roomId, but initial fetch still runs above
    
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
