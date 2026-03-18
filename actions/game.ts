'use server';

import { createServerClient } from '@/lib/supabase-server';
import { createDeck, dealCards, isSpecial, shuffleDeck, determineWinners } from '@/lib/game-logic';
import { Card } from '@/lib/types';

async function advanceTurn(supabase: ReturnType<typeof createServerClient>, gameState: Record<string, unknown>) {
  const players_order = gameState.players_order as string[];
  const pablo_caller_id = gameState.pablo_caller_id as string | null;
  const phase = gameState.phase as string;
  const current_player_index = gameState.current_player_index as number;
  
  if (phase === 'last_round') {
    let last_round_remaining = [...(gameState.last_round_remaining as string[])];
    const currentPlayerId = players_order[current_player_index];
    last_round_remaining = last_round_remaining.filter(id => id !== currentPlayerId);
    
    if (last_round_remaining.length === 0) {
      await supabase.from('game_states').update({
        phase: 'reveal',
        turn_phase: 'await_draw',
        last_round_remaining: [],
        stack_open: false,
        updated_at: new Date().toISOString(),
      }).eq('id', gameState.id as string);
      
      const { data: hands } = await supabase
        .from('player_hands')
        .select('*')
        .eq('game_state_id', gameState.id as string);
      
      if (hands) {
        const handsMap: Record<string, Card[]> = {};
        for (const h of hands) {
          handsMap[h.user_id] = h.cards;
        }
        const winners = determineWinners(handsMap);
        
        const { data: roomPlayers } = await supabase
          .from('room_players')
          .select('*')
          .eq('room_id', gameState.room_id as string);
        
        if (roomPlayers) {
          for (const winner of winners) {
            const player = roomPlayers.find((p: { user_id: string; wins: number; id: string }) => p.user_id === winner);
            if (player) {
              await supabase
                .from('room_players')
                .update({ wins: player.wins + 1 })
                .eq('id', player.id);
            }
          }
        }
        
        await supabase.from('rooms').update({ status: 'finished' }).eq('id', gameState.room_id as string);
      }
      return;
    }
    
    let nextIndex = (current_player_index + 1) % players_order.length;
    while (!last_round_remaining.includes(players_order[nextIndex])) {
      nextIndex = (nextIndex + 1) % players_order.length;
    }
    
    await supabase.from('game_states').update({
      current_player_index: nextIndex,
      turn_phase: 'await_draw',
      last_round_remaining,
      stack_open: false,
      updated_at: new Date().toISOString(),
    }).eq('id', gameState.id as string);
    return;
  }
  
  const nextIndex = (current_player_index + 1) % players_order.length;
  
  if (pablo_caller_id && players_order[nextIndex] === pablo_caller_id) {
    const skipIndex = (nextIndex + 1) % players_order.length;
    await supabase.from('game_states').update({
      current_player_index: skipIndex,
      turn_phase: 'await_draw',
      stack_open: false,
      updated_at: new Date().toISOString(),
    }).eq('id', gameState.id as string);
    return;
  }
  
  await supabase.from('game_states').update({
    current_player_index: nextIndex,
    turn_phase: 'await_draw',
    stack_open: false,
    updated_at: new Date().toISOString(),
  }).eq('id', gameState.id as string);
}

async function ensureDeck(supabase: ReturnType<typeof createServerClient>, gameStateId: string, deck: Card[], discard_pile: Card[]): Promise<Card[]> {
  if (deck.length > 0) return deck;
  
  if (discard_pile.length <= 1) {
    const newDeck = createDeck();
    await supabase.from('game_states').update({ deck: newDeck }).eq('id', gameStateId);
    return newDeck;
  }
  
  const topCard = discard_pile[discard_pile.length - 1];
  const reshuffled = shuffleDeck(discard_pile.slice(0, -1).map(c => ({ ...c, face_up: false })));
  await supabase.from('game_states').update({
    deck: reshuffled,
    discard_pile: [topCard],
    updated_at: new Date().toISOString(),
  }).eq('id', gameStateId);
  
  return reshuffled;
}

export async function startGame(roomId: string, userId: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  
  const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single();
  if (!room || room.host_user_id !== userId) {
    return { error: 'Only host can start the game' };
  }
  
  const { data: players } = await supabase
    .from('room_players')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at');
  
  if (!players || players.length < 2) {
    return { error: 'Need at least 2 players' };
  }
  
  for (let i = 0; i < players.length; i++) {
    await supabase.from('room_players').update({ seat_index: i }).eq('id', players[i].id);
  }
  
  const playerIds = players.map((p: { user_id: string }) => p.user_id);
  const deck = createDeck();
  const { hands, remainingDeck, firstDiscard } = dealCards(deck, playerIds);
  
  await supabase.from('game_states').delete().eq('room_id', roomId);
  
  const { data: gameState, error: gsError } = await supabase.from('game_states').insert({
    room_id: roomId,
    deck: remainingDeck,
    discard_pile: [firstDiscard],
    players_order: playerIds,
    current_player_index: 0,
    phase: 'peek',
    turn_phase: 'await_draw',
    drawn_card: null,
    pablo_caller_id: null,
    last_round_remaining: [],
    peek_confirmed: [],
    stack_open: false,
    special_9_first_pick: null,
    updated_at: new Date().toISOString(),
  }).select().single();
  
  if (gsError || !gameState) {
    return { error: 'Failed to create game state: ' + gsError?.message };
  }
  
  for (const pid of playerIds) {
    await supabase.from('player_hands').insert({
      game_state_id: gameState.id,
      room_id: roomId,
      user_id: pid,
      cards: hands[pid],
    });
  }
  
  await supabase.from('rooms').update({ status: 'playing' }).eq('id', roomId);
  
  return {};
}

export async function confirmPeek(gameStateId: string, userId: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  
  const { data: gs } = await supabase.from('game_states').select('*').eq('id', gameStateId).single();
  if (!gs) return { error: 'Game state not found' };
  
  const peek_confirmed = [...(gs.peek_confirmed || [])];
  if (!peek_confirmed.includes(userId)) {
    peek_confirmed.push(userId);
  }
  
  const allConfirmed = (gs.players_order as string[]).every((id: string) => peek_confirmed.includes(id));
  
  await supabase.from('game_states').update({
    peek_confirmed,
    phase: allConfirmed ? 'playing' : 'peek',
    updated_at: new Date().toISOString(),
  }).eq('id', gameStateId);
  
  return {};
}

export async function drawCard(gameStateId: string, userId: string): Promise<{ card?: Card; error?: string }> {
  const supabase = createServerClient();
  
  const { data: gs } = await supabase.from('game_states').select('*').eq('id', gameStateId).single();
  if (!gs) return { error: 'Game not found' };
  
  const players_order = gs.players_order as string[];
  const currentPlayer = players_order[gs.current_player_index];
  if (currentPlayer !== userId) return { error: 'Not your turn' };
  if (gs.turn_phase !== 'await_draw') return { error: 'Cannot draw now' };
  if (gs.phase !== 'playing' && gs.phase !== 'last_round') return { error: 'Game not in playing phase' };
  
  let deck = [...(gs.deck as Card[])];
  const discard_pile = gs.discard_pile as Card[];
  deck = await ensureDeck(supabase, gameStateId, deck, discard_pile);
  
  const drawnCard = deck[0];
  const newDeck = deck.slice(1);
  
  await supabase.from('game_states').update({
    deck: newDeck,
    drawn_card: drawnCard,
    turn_phase: 'holding',
    updated_at: new Date().toISOString(),
  }).eq('id', gameStateId);
  
  return { card: drawnCard };
}

export async function discardDrawnCard(gameStateId: string, userId: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  
  const { data: gs } = await supabase.from('game_states').select('*').eq('id', gameStateId).single();
  if (!gs) return { error: 'Game not found' };
  
  const players_order = gs.players_order as string[];
  if (players_order[gs.current_player_index] !== userId) return { error: 'Not your turn' };
  if (gs.turn_phase !== 'holding') return { error: 'Not holding a card' };
  
  const drawnCard = gs.drawn_card as Card;
  if (!drawnCard) return { error: 'No drawn card' };
  
  const discard_pile = [...(gs.discard_pile as Card[]), { ...drawnCard, face_up: true }];
  
  let turn_phase = 'post_action';
  if (drawnCard.value === 7) turn_phase = 'special_7';
  else if (drawnCard.value === 8) turn_phase = 'special_8_pick';
  else if (drawnCard.value === 9) turn_phase = 'special_9_pick1';
  
  const isSpecialCard = isSpecial(drawnCard);
  
  await supabase.from('game_states').update({
    discard_pile,
    drawn_card: null,
    turn_phase,
    stack_open: !isSpecialCard,
    updated_at: new Date().toISOString(),
  }).eq('id', gameStateId);
  
  return {};
}

export async function swapCard(gameStateId: string, userId: string, cardIndex: number): Promise<{ error?: string }> {
  const supabase = createServerClient();
  
  const { data: gs } = await supabase.from('game_states').select('*').eq('id', gameStateId).single();
  if (!gs) return { error: 'Game not found' };
  
  const players_order = gs.players_order as string[];
  if (players_order[gs.current_player_index] !== userId) return { error: 'Not your turn' };
  if (gs.turn_phase !== 'holding') return { error: 'Not holding a card' };
  
  const drawnCard = gs.drawn_card as Card;
  if (!drawnCard) return { error: 'No drawn card' };
  
  const { data: hand } = await supabase
    .from('player_hands')
    .select('*')
    .eq('game_state_id', gameStateId)
    .eq('user_id', userId)
    .single();
  
  if (!hand) return { error: 'Hand not found' };
  
  const cards = [...(hand.cards as Card[])];
  if (cardIndex >= cards.length) return { error: 'Invalid card index' };
  
  const oldCard = cards[cardIndex];
  cards[cardIndex] = drawnCard;
  
  const discard_pile = [...(gs.discard_pile as Card[]), { ...oldCard, face_up: true }];
  
  let turn_phase = 'post_action';
  if (oldCard.value === 7) turn_phase = 'special_7';
  else if (oldCard.value === 8) turn_phase = 'special_8_pick';
  else if (oldCard.value === 9) turn_phase = 'special_9_pick1';
  
  const isSpecialCard = isSpecial(oldCard);
  
  await Promise.all([
    supabase.from('player_hands').update({ cards }).eq('id', hand.id),
    supabase.from('game_states').update({
      discard_pile,
      drawn_card: null,
      turn_phase,
      stack_open: !isSpecialCard,
      updated_at: new Date().toISOString(),
    }).eq('id', gameStateId),
  ]);
  
  return {};
}

export async function useSpecial7(gameStateId: string, userId: string, cardIndex: number): Promise<{ card?: Card; error?: string }> {
  const supabase = createServerClient();
  
  const { data: gs } = await supabase.from('game_states').select('*').eq('id', gameStateId).single();
  if (!gs) return { error: 'Game not found' };
  if (gs.turn_phase !== 'special_7') return { error: 'Not in special 7 phase' };
  if ((gs.players_order as string[])[gs.current_player_index] !== userId) return { error: 'Not your turn' };
  
  const { data: hand } = await supabase
    .from('player_hands')
    .select('*')
    .eq('game_state_id', gameStateId)
    .eq('user_id', userId)
    .single();
  
  if (!hand) return { error: 'Hand not found' };
  const cards = hand.cards as Card[];
  if (cardIndex >= cards.length) return { error: 'Invalid index' };
  
  const card = cards[cardIndex];
  
  await supabase.from('game_states').update({
    turn_phase: 'post_action',
    stack_open: true,
    updated_at: new Date().toISOString(),
  }).eq('id', gameStateId);
  
  return { card };
}

export async function pickSpecial8Target(gameStateId: string, userId: string, targetUserId: string, cardIndex: number): Promise<{ card?: Card; error?: string }> {
  const supabase = createServerClient();
  
  const { data: gs } = await supabase.from('game_states').select('*').eq('id', gameStateId).single();
  if (!gs) return { error: 'Game not found' };
  if (gs.turn_phase !== 'special_8_pick') return { error: 'Not in special 8 phase' };
  if ((gs.players_order as string[])[gs.current_player_index] !== userId) return { error: 'Not your turn' };
  
  const { data: hand } = await supabase
    .from('player_hands')
    .select('*')
    .eq('game_state_id', gameStateId)
    .eq('user_id', targetUserId)
    .single();
  
  if (!hand) return { error: 'Target hand not found' };
  const cards = hand.cards as Card[];
  if (cardIndex >= cards.length) return { error: 'Invalid index' };
  
  const card = cards[cardIndex];
  
  await supabase.from('game_states').update({
    turn_phase: 'post_action',
    stack_open: true,
    updated_at: new Date().toISOString(),
  }).eq('id', gameStateId);
  
  return { card };
}

export async function pickSpecial9First(gameStateId: string, userId: string, targetUserId: string, cardIndex: number): Promise<{ error?: string }> {
  const supabase = createServerClient();
  
  const { data: gs } = await supabase.from('game_states').select('*').eq('id', gameStateId).single();
  if (!gs) return { error: 'Game not found' };
  if (gs.turn_phase !== 'special_9_pick1') return { error: 'Not in special 9 phase 1' };
  if ((gs.players_order as string[])[gs.current_player_index] !== userId) return { error: 'Not your turn' };
  
  await supabase.from('game_states').update({
    turn_phase: 'special_9_pick2',
    special_9_first_pick: { player_id: targetUserId, card_index: cardIndex },
    updated_at: new Date().toISOString(),
  }).eq('id', gameStateId);
  
  return {};
}

export async function pickSpecial9Second(gameStateId: string, userId: string, targetUserId: string, cardIndex: number): Promise<{ error?: string }> {
  const supabase = createServerClient();
  
  const { data: gs } = await supabase.from('game_states').select('*').eq('id', gameStateId).single();
  if (!gs) return { error: 'Game not found' };
  if (gs.turn_phase !== 'special_9_pick2') return { error: 'Not in special 9 phase 2' };
  if ((gs.players_order as string[])[gs.current_player_index] !== userId) return { error: 'Not your turn' };
  
  const firstPick = gs.special_9_first_pick as { player_id: string; card_index: number };
  
  const [{ data: hand1 }, { data: hand2 }] = await Promise.all([
    supabase.from('player_hands').select('*').eq('game_state_id', gameStateId).eq('user_id', firstPick.player_id).single(),
    supabase.from('player_hands').select('*').eq('game_state_id', gameStateId).eq('user_id', targetUserId).single(),
  ]);
  
  if (!hand1 || !hand2) return { error: 'Hands not found' };
  
  const cards1 = [...(hand1.cards as Card[])];
  const cards2 = [...(hand2.cards as Card[])];
  
  if (firstPick.card_index >= cards1.length || cardIndex >= cards2.length) {
    return { error: 'Invalid card index' };
  }
  
  const temp = cards1[firstPick.card_index];
  cards1[firstPick.card_index] = cards2[cardIndex];
  cards2[cardIndex] = temp;
  
  await Promise.all([
    supabase.from('player_hands').update({ cards: cards1 }).eq('id', hand1.id),
    supabase.from('player_hands').update({ cards: cards2 }).eq('id', hand2.id),
    supabase.from('game_states').update({
      turn_phase: 'post_action',
      special_9_first_pick: null,
      stack_open: true,
      updated_at: new Date().toISOString(),
    }).eq('id', gameStateId),
  ]);
  
  return {};
}

export async function stackCard(
  gameStateId: string,
  userId: string,
  myCardIndex: number,
  targetUserId?: string
): Promise<{ error?: string }> {
  const supabase = createServerClient();
  
  const { data: gs } = await supabase.from('game_states').select('*').eq('id', gameStateId).single();
  if (!gs) return { error: 'Game not found' };
  if (!gs.stack_open) return { error: 'Stacking not allowed right now' };
  
  const discard_pile = gs.discard_pile as Card[];
  const topDiscard = discard_pile[discard_pile.length - 1];
  if (!topDiscard) return { error: 'No discard card' };
  
  const { data: myHand } = await supabase
    .from('player_hands')
    .select('*')
    .eq('game_state_id', gameStateId)
    .eq('user_id', userId)
    .single();
  
  if (!myHand) return { error: 'Your hand not found' };
  const myCards = [...(myHand.cards as Card[])];
  
  if (myCardIndex >= myCards.length) return { error: 'Invalid card index' };
  
  const isOwnStack = !targetUserId || targetUserId === userId;
  
  if (isOwnStack) {
    const myCard = myCards[myCardIndex];
    const matches = myCard.value === topDiscard.value;
    
    if (matches) {
      myCards.splice(myCardIndex, 1);
      const newDiscard = [...discard_pile, { ...myCard, face_up: true }];
      await Promise.all([
        supabase.from('player_hands').update({ cards: myCards }).eq('id', myHand.id),
        supabase.from('game_states').update({
          discard_pile: newDiscard,
          stack_open: false,
          updated_at: new Date().toISOString(),
        }).eq('id', gameStateId),
      ]);
    } else {
      let deck = [...(gs.deck as Card[])];
      deck = await ensureDeck(supabase, gameStateId, deck, discard_pile);
      const penaltyCard = deck[0];
      const newDeck = deck.slice(1);
      myCards.push(penaltyCard);
      await Promise.all([
        supabase.from('player_hands').update({ cards: myCards }).eq('id', myHand.id),
        supabase.from('game_states').update({
          deck: newDeck,
          stack_open: false,
          updated_at: new Date().toISOString(),
        }).eq('id', gameStateId),
      ]);
    }
  } else {
    const { data: targetHand } = await supabase
      .from('player_hands')
      .select('*')
      .eq('game_state_id', gameStateId)
      .eq('user_id', targetUserId)
      .single();
    
    if (!targetHand) return { error: 'Target hand not found' };
    const targetCards = [...(targetHand.cards as Card[])];
    
    if (myCardIndex >= targetCards.length) return { error: 'Invalid target card index' };
    
    const targetCard = targetCards[myCardIndex];
    const matches = targetCard.value === topDiscard.value;
    
    if (matches) {
      targetCards.splice(myCardIndex, 1);
      
      if (myCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * myCards.length);
        const cardToGive = myCards[randomIndex];
        myCards.splice(randomIndex, 1);
        targetCards.push(cardToGive);
      }
      
      const newDiscard = [...discard_pile, { ...targetCard, face_up: true }];
      await Promise.all([
        supabase.from('player_hands').update({ cards: myCards }).eq('id', myHand.id),
        supabase.from('player_hands').update({ cards: targetCards }).eq('id', targetHand.id),
        supabase.from('game_states').update({
          discard_pile: newDiscard,
          stack_open: false,
          updated_at: new Date().toISOString(),
        }).eq('id', gameStateId),
      ]);
    } else {
      const penaltyCard = { ...topDiscard };
      const newDiscard = discard_pile.slice(0, -1);
      myCards.push(penaltyCard);
      await Promise.all([
        supabase.from('player_hands').update({ cards: myCards }).eq('id', myHand.id),
        supabase.from('game_states').update({
          discard_pile: newDiscard,
          stack_open: false,
          updated_at: new Date().toISOString(),
        }).eq('id', gameStateId),
      ]);
    }
  }
  
  return {};
}

export async function callPablo(gameStateId: string, userId: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  
  const { data: gs } = await supabase.from('game_states').select('*').eq('id', gameStateId).single();
  if (!gs) return { error: 'Game not found' };
  if ((gs.players_order as string[])[gs.current_player_index] !== userId) return { error: 'Not your turn' };
  if (gs.turn_phase !== 'post_action') return { error: 'Cannot call Pablo now' };
  
  const players_order = gs.players_order as string[];
  const last_round_remaining = players_order.filter((id: string) => id !== userId);
  const nextIndex = (gs.current_player_index + 1) % players_order.length;
  
  await supabase.from('game_states').update({
    phase: 'last_round',
    pablo_caller_id: userId,
    last_round_remaining,
    current_player_index: nextIndex,
    turn_phase: 'await_draw',
    stack_open: false,
    updated_at: new Date().toISOString(),
  }).eq('id', gameStateId);
  
  return {};
}

export async function endTurn(gameStateId: string, userId: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  
  const { data: gs } = await supabase.from('game_states').select('*').eq('id', gameStateId).single();
  if (!gs) return { error: 'Game not found' };
  if ((gs.players_order as string[])[gs.current_player_index] !== userId) return { error: 'Not your turn' };
  if (gs.turn_phase !== 'post_action') return { error: 'Cannot end turn now' };
  
  await advanceTurn(supabase, gs);
  
  return {};
}

export async function startNewRound(roomId: string, userId: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  
  const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single();
  if (!room || room.host_user_id !== userId) {
    return { error: 'Only host can start a new round' };
  }
  
  await supabase.from('game_states').delete().eq('room_id', roomId);
  
  const { data: players } = await supabase
    .from('room_players')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at');
  
  if (!players || players.length < 2) {
    return { error: 'Need at least 2 players' };
  }
  
  const playerIds = players.map((p: { user_id: string }) => p.user_id);
  const deck = createDeck();
  const { hands, remainingDeck, firstDiscard } = dealCards(deck, playerIds);
  
  const { data: gameState, error: gsError } = await supabase.from('game_states').insert({
    room_id: roomId,
    deck: remainingDeck,
    discard_pile: [firstDiscard],
    players_order: playerIds,
    current_player_index: 0,
    phase: 'peek',
    turn_phase: 'await_draw',
    drawn_card: null,
    pablo_caller_id: null,
    last_round_remaining: [],
    peek_confirmed: [],
    stack_open: false,
    special_9_first_pick: null,
    updated_at: new Date().toISOString(),
  }).select().single();
  
  if (gsError || !gameState) {
    return { error: 'Failed to create game state' };
  }
  
  for (const pid of playerIds) {
    await supabase.from('player_hands').insert({
      game_state_id: gameState.id,
      room_id: roomId,
      user_id: pid,
      cards: hands[pid],
    });
  }
  
  await supabase.from('rooms').update({ status: 'playing' }).eq('id', roomId);
  
  return {};
}
