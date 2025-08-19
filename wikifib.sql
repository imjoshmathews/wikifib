CREATE TABLE "games" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "room_code" varchar(5) NOT NULL UNIQUE,
  "max_score" integer,
  "max_articles" integer NOT NULL,
  "max_rounds" integer,
  "current_round" integer NOT NULL,
  "created_at" timestamp NOT NULL
);

CREATE TABLE "players" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "game_id" integer NOT NULL,
  "socket_id" text UNIQUE NOT NULL,
  "screenname" varchar(255) NOT NULL,
  "score" integer NOT NULL,
  "is_host" boolean NOT NULL,
  "is_interrogator" boolean NOT NULL,
  "is_honest" boolean NOT NULL,
  "is_connected" boolean
);

CREATE TABLE "articles" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "player_id" integer NOT NULL,
  "wiki_id" integer NOT NULL,
  "title" text NOT NULL,
  "is_selected" boolean NOT NULL
);

ALTER TABLE "articles" ADD FOREIGN KEY ("player_id") REFERENCES "players" ("id");

ALTER TABLE "players" ADD FOREIGN KEY ("game_id") REFERENCES "games" ("id");