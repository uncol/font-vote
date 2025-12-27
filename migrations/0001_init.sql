CREATE TABLE IF NOT EXISTS collection1 (
  semantic TEXT PRIMARY KEY,
  icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS journal (
  id TEXT PRIMARY KEY,
  semantic TEXT NOT NULL,
  icon TEXT NOT NULL,
  user TEXT NOT NULL,
  created TEXT NOT NULL,
  applied INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS journal_created_idx ON journal (created);
CREATE INDEX IF NOT EXISTS journal_semantic_idx ON journal (semantic);
CREATE INDEX IF NOT EXISTS journal_user_idx ON journal (user);
