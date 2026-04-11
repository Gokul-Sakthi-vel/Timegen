-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Faculty Table
CREATE TABLE faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  availability TEXT[],
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Subjects Table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  hours INTEGER NOT NULL,
  credits INTEGER,
  priority TEXT,
  color TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Classes Table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  students_count INTEGER,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Rooms Table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  capacity INTEGER,
  type TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Timetables Table
CREATE TABLE timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  timetable_data JSONB,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Join Table for Faculty and Subjects (Many-to-Many)
CREATE TABLE faculty_subjects (
  faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (faculty_id, subject_id)
);

-- Join Table for Classes and Subjects (Many-to-Many)
CREATE TABLE class_subjects (
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, subject_id)
);
