CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  game_type VARCHAR(30) NOT NULL,
  bet_amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(5) NOT NULL,
  outcome VARCHAR(20),
  win_amount DECIMAL(12,2) DEFAULT 0,
  provable_seed VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_created_at ON game_sessions(created_at);
CREATE INDEX idx_game_sessions_game_type ON game_sessions(game_type);
