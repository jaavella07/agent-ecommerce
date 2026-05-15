CREATE TABLE IF NOT EXISTS interactions (
  id         SERIAL PRIMARY KEY,
  user_input TEXT        NOT NULL,
  intent     TEXT        NOT NULL,
  response   TEXT,
  metadata   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
