'use server';

import { createServerClient } from '@/lib/supabase-server';
import { generateRoomCode } from '@/lib/game-logic';

export async function createRoom(displayName: string, userId: string): Promise<{ roomCode: string; userId: string; error?: string }> {
  const supabase = createServerClient();
  
  if (!userId) {
    return { roomCode: '', userId: '', error: 'Missing user ID' };
  }
  
  let code = '';
  let attempts = 0;
  while (attempts < 10) {
    code = generateRoomCode();
    const { data: existing } = await supabase.from('rooms').select('id').eq('code', code).single();
    if (!existing) break;
    attempts++;
  }
  
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({ code, host_user_id: userId, status: 'lobby' })
    .select()
    .single();
  
  if (roomError || !room) {
    return { roomCode: '', userId: '', error: 'Failed to create room: ' + roomError?.message };
  }
  
  const { error: playerError } = await supabase
    .from('room_players')
    .insert({ room_id: room.id, user_id: userId, display_name: displayName });
  
  if (playerError) {
    return { roomCode: '', userId: '', error: 'Failed to join room: ' + playerError?.message };
  }
  
  return { roomCode: code, userId };
}

export async function joinRoom(code: string, displayName: string, userId: string): Promise<{ roomId: string; userId: string; error?: string }> {
  const supabase = createServerClient();
  
  if (!userId) {
    return { roomId: '', userId: '', error: 'Missing user ID' };
  }
  
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();
  
  if (roomError || !room) {
    return { roomId: '', userId: '', error: 'Room not found' };
  }
  
  if (room.status !== 'lobby') {
    return { roomId: '', userId: '', error: 'Game already in progress' };
  }
  
  const { data: players } = await supabase
    .from('room_players')
    .select('id')
    .eq('room_id', room.id);
  
  if (players && players.length >= 8) {
    return { roomId: '', userId: '', error: 'Room is full' };
  }
  
  const { error: upsertError } = await supabase
    .from('room_players')
    .upsert({ room_id: room.id, user_id: userId, display_name: displayName }, { onConflict: 'room_id,user_id' });
  
  if (upsertError) {
    return { roomId: '', userId: '', error: 'Failed to join: ' + upsertError.message };
  }
  
  return { roomId: room.id, userId };
}

export async function leaveRoom(roomId: string, userId: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  
  await supabase.from('room_players').delete().eq('room_id', roomId).eq('user_id', userId);
  
  const { data: remaining } = await supabase.from('room_players').select('user_id').eq('room_id', roomId);
  
  if (!remaining || remaining.length === 0) {
    await supabase.from('rooms').delete().eq('id', roomId);
  } else {
    const { data: room } = await supabase.from('rooms').select('host_user_id').eq('id', roomId).single();
    if (room && room.host_user_id === userId) {
      await supabase.from('rooms').update({ host_user_id: remaining[0].user_id }).eq('id', roomId);
    }
  }
  
  return {};
}
