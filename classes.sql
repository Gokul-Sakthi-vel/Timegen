CREATE TABLE classes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT,
  year INTEGER,
  section TEXT,
  department TEXT
);
