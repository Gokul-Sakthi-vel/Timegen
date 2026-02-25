CREATE TABLE subjects (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT,
  code TEXT,
  hours_per_week INTEGER,
  type TEXT
);
