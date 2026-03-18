-- Enable RLS
-- rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- room_players
CREATE TABLE room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  seat_index INTEGER,
  wins INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- game_states
CREATE TABLE game_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL UNIQUE,
  deck JSONB NOT NULL DEFAULT '[]',
  discard_pile JSONB NOT NULL DEFAULT '[]',
  players_order JSONB NOT NULL DEFAULT '[]',
  current_player_index INTEGER NOT NULL DEFAULT 0,
  phase TEXT NOT NULL DEFAULT 'peek',
  turn_phase TEXT NOT NULL DEFAULT 'await_draw',
  drawn_card JSONB,
  pablo_caller_id UUID,
  last_round_remaining JSONB DEFAULT '[]',
  peek_confirmed JSONB DEFAULT '[]',
  stack_open BOOLEAN NOT NULL DEFAULT FALSE,
  special_9_first_pick JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- player_hands
CREATE TABLE player_hands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_state_id UUID REFERENCES game_states(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  cards JSONB NOT NULL DEFAULT '[]',
  UNIQUE(game_state_id, user_id)
);
