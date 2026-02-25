import { Request, Response } from 'express';
import { supabase } from '../supabase';

type FacultyRow = {
  id: string;
  name: string;
  email: string;
  availability: string[] | null;
  faculty_subjects?: Array<{ subject_id: string }>;
};

const mapFacultyRow = (row: FacultyRow) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  availability: row.availability || [],
  subjects: (row.faculty_subjects || []).map(item => item.subject_id),
});

export const getFaculty = async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('faculty')
    .select('id,name,email,availability,faculty_subjects(subject_id)')
    .order('name', { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json((data as FacultyRow[]).map(mapFacultyRow));
};

export const getFacultyById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('faculty')
    .select('id,name,email,availability,faculty_subjects(subject_id)')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: 'Faculty not found' });
  }

  res.json(mapFacultyRow(data as FacultyRow));
};

export const createFaculty = async (req: Request, res: Response) => {
  const { name, email, availability, subjects } = req.body as {
    name?: string;
    email?: string;
    availability?: string[];
    subjects?: string[];
  };

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required.' });
  }

  const { data, error } = await supabase
    .from('faculty')
    .insert([{ name, email, availability: availability || [] }])
    .select('id,name,email,availability')
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
    availability: data.availability || [],
    subjects: subjects || [],
  });
};

export const updateFaculty = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, availability, subjects } = req.body as {
    name?: string;
    email?: string;
    availability?: string[];
    subjects?: string[];
  };

  const { data, error } = await supabase
    .from('faculty')
    .update({ name, email, availability: availability || [] })
    .eq('id', id)
    .select('id,name,email,availability')
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
    availability: data.availability || [],
    subjects: subjects || [],
  });
};

export const deleteFaculty = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('faculty').delete().eq('id', id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(204).send();
};
