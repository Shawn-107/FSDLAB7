-- Reference schema; server/store.js creates the same table automatically.
CREATE TABLE IF NOT EXISTS software (
  id TEXT PRIMARY KEY,
  product TEXT NOT NULL,
  vendor TEXT NOT NULL,
  version TEXT NOT NULL,
  category TEXT NOT NULL,
  environment TEXT NOT NULL,
  priority TEXT NOT NULL,
  notes TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
