import express from "express";
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../supabase';

type FacultyRow = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  availability: string[] | null;
  faculty_subjects?: Array<{ subject_id: string }>;
};

const mapFacultyRow = (row: FacultyRow) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  availability: row.availability || [],
  subjects: (row.faculty_subjects || []).map(item => item.subject_id),
});

const filterPayload = async (table: string, payload: Record<string, any>) => {
  try {
    const { data } = await supabase.from(table).select().limit(1);
    const existingKeys = data && data.length > 0 ? Object.keys(data[0]) : [];
    
    if (existingKeys.length > 0) {
        const allowedKeys = new Set([...existingKeys, 'user_id', 'credits', 'weekly_periods', 'is_fixed']);
        return Object.fromEntries(
            Object.entries(payload).filter(([key, val]) => allowedKeys.has(key) && val !== undefined)
        );
    }
    
    return Object.fromEntries(
      Object.entries(payload).filter(([_, val]) => val !== undefined)
    );
  } catch {
    return Object.fromEntries(
      Object.entries(payload).filter(([_, val]) => val !== undefined)
    );
  }
};

export const getFaculty = async (req: AuthRequest, res: express.Response) => {
  const { data, error } = await supabase
    .from('faculty')
    .select('*,faculty_subjects(subject_id)')
    .eq('user_id', req.userId)
    .order('name', { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json((data as FacultyRow[]).map(mapFacultyRow));
};

export const getFacultyById = async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('faculty')
    .select('*,faculty_subjects(subject_id)')
    .eq('id', id)
    .eq('user_id', req.userId)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: 'Faculty not found' });
  }

  res.json(mapFacultyRow(data as FacultyRow));
};

export const createFaculty = async (req: AuthRequest, res: express.Response) => {
  try {
    const { name, email, phone, availability, subjects } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      availability?: string[];
      subjects?: string[];
    };

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required.' });
    }

    const rawPayload = { name, email, phone, availability: availability || [], user_id: req.userId };
    const payload = await filterPayload('faculty', rawPayload);

    const { data, error } = await supabase
      .from('faculty')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (subjects && subjects.length > 0) {
      const joinRows = subjects.map(subjectId => ({
        faculty_id: data.id,
        subject_id: subjectId,
      }));
      const { error: joinError } = await supabase.from('faculty_subjects').insert(joinRows);
      if (joinError) {
        return res.status(500).json({ error: joinError.message });
      }
    }

    res.status(201).json({
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      availability: data.availability || [],
      subjects: subjects || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

export const updateFaculty = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, availability, subjects } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      availability?: string[];
      subjects?: string[];
    };

    const rawUpdate = { name, email, phone, availability: availability || [] };
    const payload = await filterPayload('faculty', rawUpdate);

    const { data, error } = await supabase
      .from('faculty')
      .update(payload)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { error: clearError } = await supabase.from('faculty_subjects').delete().eq('faculty_id', id);
    if (clearError) {
      return res.status(500).json({ error: clearError.message });
    }

    if (subjects && subjects.length > 0) {
      const joinRows = subjects.map(subjectId => ({
        faculty_id: id,
        subject_id: subjectId,
      }));
      const { error: joinError } = await supabase.from('faculty_subjects').insert(joinRows);
      if (joinError) {
        return res.status(500).json({ error: joinError.message });
      }
    }

    res.json({
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      availability: data.availability || [],
      subjects: subjects || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

export const deleteFaculty = async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const ids = req.query.ids as string;

  if (ids) {
    const idList = ids.split(',');
    const { error } = await supabase.from('faculty').delete().in('id', idList).eq('user_id', req.userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).send();
  }

  const { error } = await supabase.from('faculty').delete().eq('id', id).eq('user_id', req.userId);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(204).send();
};


