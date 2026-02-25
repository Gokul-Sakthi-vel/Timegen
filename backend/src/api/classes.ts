import { Request, Response } from 'express';
import { supabase } from '../supabase';

type ClassRow = {
  id: string;
  name: string;
  students_count: number;
  class_subjects?: Array<{ subject_id: string }>;
};

const mapClassRow = (row: ClassRow) => ({
  id: row.id,
  name: row.name,
  studentsCount: row.students_count,
  subjects: (row.class_subjects || []).map(item => item.subject_id),
});

export const getClasses = async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('classes')
    .select('id,name,students_count,class_subjects(subject_id)')
    .order('name', { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json((data as ClassRow[]).map(mapClassRow));
};

export const getClassById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('classes')
    .select('id,name,students_count,class_subjects(subject_id)')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: 'Class not found' });
  }

  res.json(mapClassRow(data as ClassRow));
};

export const createClass = async (req: Request, res: Response) => {
  const { name, studentsCount, subjects } = req.body as {
    name?: string;
    studentsCount?: number;
    subjects?: string[];
  };

  if (!name || typeof studentsCount !== 'number') {
    return res.status(400).json({ error: 'name and studentsCount are required.' });
  }

  const { data, error } = await supabase
    .from('classes')
    .insert([{ name, students_count: studentsCount }])
    .select('id,name,students_count')
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (subjects && subjects.length > 0) {
    const joinRows = subjects.map(subjectId => ({
      class_id: data.id,
      subject_id: subjectId,
    }));
    const { error: joinError } = await supabase.from('class_subjects').insert(joinRows);
    if (joinError) {
      return res.status(500).json({ error: joinError.message });
    }
  }

  res.status(201).json({
    id: data.id,
    name: data.name,
    studentsCount: data.students_count,
    subjects: subjects || [],
  });
};

export const updateClass = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, studentsCount, subjects } = req.body as {
    name?: string;
    studentsCount?: number;
    subjects?: string[];
  };

  const { data, error } = await supabase
    .from('classes')
    .update({ name, students_count: studentsCount })
    .eq('id', id)
    .select('id,name,students_count')
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const { error: clearError } = await supabase.from('class_subjects').delete().eq('class_id', id);
  if (clearError) {
    return res.status(500).json({ error: clearError.message });
  }

  if (subjects && subjects.length > 0) {
    const joinRows = subjects.map(subjectId => ({
      class_id: id,
      subject_id: subjectId,
    }));
    const { error: joinError } = await supabase.from('class_subjects').insert(joinRows);
    if (joinError) {
      return res.status(500).json({ error: joinError.message });
    }
  }

  res.json({
    id: data.id,
    name: data.name,
    studentsCount: data.students_count,
    subjects: subjects || [],
  });
};

export const deleteClass = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('classes').delete().eq('id', id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(204).send();
};
