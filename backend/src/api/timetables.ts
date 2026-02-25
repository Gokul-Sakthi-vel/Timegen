import { Request, Response } from 'express';
import { supabase } from '../supabase';

type TimetableRow = {
  id: string;
  name: string;
  created_at: string;
  timetable_data: unknown;
};

type TimetablePayload = {
  schedule: unknown[];
  settingsSnapshot?: unknown;
};

const parseTimetableData = (value: unknown): TimetablePayload => {
  if (Array.isArray(value)) {
    return { schedule: value };
  }

  if (value && typeof value === 'object') {
    const maybe = value as { schedule?: unknown; settingsSnapshot?: unknown };
    return {
      schedule: Array.isArray(maybe.schedule) ? maybe.schedule : [],
      settingsSnapshot: maybe.settingsSnapshot,
    };
  }

  return { schedule: [] };
};

const mapTimetable = (row: TimetableRow) => {
  const parsed = parseTimetableData(row.timetable_data);
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    schedule: parsed.schedule,
    settingsSnapshot: parsed.settingsSnapshot ?? null,
  };
};

export const getTimetables = async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('timetables')
    .select('id,name,created_at,timetable_data')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json((data as TimetableRow[]).map(mapTimetable));
};

export const createTimetable = async (req: Request, res: Response) => {
  const { name, schedule, createdAt, settingsSnapshot } = req.body as {
    name?: string;
    schedule?: unknown[];
    createdAt?: string;
    settingsSnapshot?: unknown;
  };

  if (!name) {
    return res.status(400).json({ error: 'name is required.' });
  }

  const payload: { name: string; timetable_data: unknown; created_at?: string } = {
    name,
    timetable_data: {
      schedule: Array.isArray(schedule) ? schedule : [],
      settingsSnapshot: settingsSnapshot ?? null,
    },
  };

  if (createdAt) {
    payload.created_at = createdAt;
  }

  const { data, error } = await supabase
    .from('timetables')
    .insert([payload])
    .select('id,name,created_at,timetable_data')
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(mapTimetable(data as TimetableRow));
};

export const updateTimetable = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { schedule, settingsSnapshot } = req.body as {
    schedule?: unknown[];
    settingsSnapshot?: unknown;
  };

  if (!Array.isArray(schedule)) {
    return res.status(400).json({ error: 'schedule must be an array.' });
  }

  const { data, error } = await supabase
    .from('timetables')
    .update({
      timetable_data: {
        schedule,
        settingsSnapshot: settingsSnapshot ?? null,
      },
    })
    .eq('id', id)
    .select('id,name,created_at,timetable_data')
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(mapTimetable(data as TimetableRow));
};

export const deleteTimetable = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('timetables').delete().eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(204).send();
};
