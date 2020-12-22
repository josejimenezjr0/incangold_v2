CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DROP TABLE IF EXISTS games;
CREATE TABLE games (
  game_uuid uuid DEFAULT uuid_generate_v4 () PRIMARY KEY,
  room VARCHAR(255) NOT NULL,
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

CREATE TABLE deck (
  card_id SERIAL PRIMARY KEY,
  game_uuid uuid,
  value int,
  type VARCHAR(255),
  on_board BOOLEAN DEFAULT false,
  placement int
);

CREATE TABLE hazards (
  hazards_id SERIAL PRIMARY KEY,
  game_uuid uuid,
  rocks int NOT NULL DEFAULT 0,
  snakes int NOT NULL DEFAULT 0,
  monster int NOT NULL DEFAULT 0,
  fire int NOT NULL DEFAULT 0,
  spiders int NOT NULL DEFAULT 0
);

CREATE TABLE player_artifacts (
  artifact_id SERIAL PRIMARY KEY,
  card_id int,
  player_uuid uuid
);

ALTER TABLE "players" ADD FOREIGN KEY ("game_uuid") REFERENCES "games" ("game_uuid");

ALTER TABLE "deck" ADD FOREIGN KEY ("game_uuid") REFERENCES "games" ("game_uuid");

ALTER TABLE "hazards" ADD FOREIGN KEY ("game_uuid") REFERENCES "games" ("game_uuid");

ALTER TABLE "player_artifacts" ADD FOREIGN KEY ("card_id") REFERENCES "deck" ("card_id");

ALTER TABLE "player_artifacts" ADD FOREIGN KEY ("player_uuid") REFERENCES "players" ("player_uuid");