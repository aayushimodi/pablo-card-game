export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type FaceValue = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  value: FaceValue;
  face_up?: boolean;
}

export type RoomStatus = 'lobby' | 'playing' | 'finished';
export type GamePhase = 'peek' | 'playing' | 'last_round' | 'reveal';
export type TurnPhase = 'await_draw' | 'holding' | 'post_action' | 'special_7' | 'special_8_pick' | 'special_9_pick1' | 'special_9_pick2';

export interface Room {
  id: string;
  code: string;
  host_user_id: string;
  status: RoomStatus;
  created_at: string;
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  seat_index: number | null;
  wins: number;
  joined_at: string;
}

export interface GameState {
  id: string;
  room_id: string;
  deck: Card[];
  discard_pile: Card[];
  players_order: string[];
  current_player_index: number;
  phase: GamePhase;
  turn_phase: TurnPhase;
  drawn_card: Card | null;
  pablo_caller_id: string | null;
  last_round_remaining: string[];
  peek_confirmed: string[];
  stack_open: boolean;
  special_9_first_pick: { player_id: string; card_index: number } | null;
  updated_at: string;
}

export interface PlayerHand {
  id: string;
  game_state_id: string;
  room_id: string;
  user_id: string;
  cards: Card[];
}

export interface GameSnapshot {
  gameState: GameState;
  playerHands: PlayerHand[];
  players: RoomPlayer[];
  room: Room;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}
