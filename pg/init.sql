CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DROP TABLE IF EXISTS games;
CREATE TABLE games (
  game_uuid uuid DEFAULT uuid_generate_v4 () PRIMARY KEY,
  room VARCHAR(255) NOT NULL,
  deck JSONB NOT NULL,
  size INT NOT NULL CHECK (size > 0),
  player_order INT NOT NULL DEFAULT 1,
  round INT NOT NULL DEFAULT 0,
  quest_cycle VARCHAR(255) NOT NULL,
  end_camp BOOLEAN NOT NULL DEFAULT false,
  end_hazard BOOLEAN NOT NULL DEFAULT false,
  one_player BOOLEAN NOT NULL DEFAULT false,
  spare INT NOT NULL DEFAULT 0,
  artifacts INT NOT NULL DEFAULT 0
);

DROP TABLE IF EXISTS players;
CREATE TABLE players (
  player_uuid uuid DEFAULT uuid_generate_v4 () PRIMARY KEY,
  game_uuid uuid,
  socket_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  player_order INT NOT NULL,
  host BOOLEAN NOT NULL DEFAULT false,
  online BOOLEAN NOT NULL DEFAULT false,
  round_score INT NOT NULL DEFAULT 0,
  total_score INT NOT NULL DEFAULT 0,
  left_round BOOLEAN NOT NULL DEFAULT false,
  show_choice BOOLEAN NOT NULL DEFAULT true,
  choice_made BOOLEAN NOT NULL DEFAULT true,
  choice VARCHAR(255) NOT NULL
);

ALTER TABLE "players" ADD FOREIGN KEY ("game_uuid") REFERENCES "games" ("game_uuid");