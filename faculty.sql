CREATE TABLE faculty (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT,
  email TEXT,
  department TEXT,
  designation TEXT
);
