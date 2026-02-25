import { Request, Response } from 'express';
import { supabase } from '../supabase';

const generateFallbackCode = () => `SUB${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

export const getSubjects = async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name', { ascending: true });
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
};

export const getSubjectById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('subjects').select('*').eq('id', id).single();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: 'Subject not found' });
  }
  res.json(data);
};

export const createSubject = async (req: Request, res: Response) => {
  const { name, code, hours, priority, color, subjectType } = req.body;

  if (!name || typeof hours !== 'number') {
    return res
      .status(400)
      .json({ error: 'name and numeric hours are required.' });
  }

  const normalizedCode = (typeof code === 'string' && code.trim().length > 0)
    ? code.trim().toUpperCase()
    : generateFallbackCode();

  const payload: Record<string, unknown> = {
    name,
    code: normalizedCode,
    hours,
    priority,
    color,
    subject_type: subjectType || 'Theory',
  };

  let { data, error } = await supabase
    .from('subjects')
    .insert([payload])
    .select('*')
    .single();

  if (error && error.message.includes('subject_type')) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.subject_type;
    const fallback = await supabase
      .from('subjects')
      .insert([fallbackPayload])
      .select('*')
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
};

export const updateSubject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, code, hours, priority, color, subjectType } = req.body;
  const updatePayload: Record<string, unknown> = {
    name,
    code: typeof code === 'string' && code.trim().length > 0 ? code.trim().toUpperCase() : undefined,
    hours,
    priority,
    color,
    subject_type: subjectType,
  };

  const cleanedPayload = Object.fromEntries(
    Object.entries(updatePayload).filter(([, value]) => value !== undefined)
  );

  let { data, error } = await supabase
    .from('subjects')
    .update(cleanedPayload)
    .eq('id', id)
    .select('*')
    .single();

  if (error && error.message.includes('subject_type')) {
    const fallbackPayload = { ...cleanedPayload };
    delete fallbackPayload.subject_type;
    const fallback = await supabase
      .from('subjects')
      .update(fallbackPayload)
      .eq('id', id)
      .select('*')
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
};

export const deleteSubject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(204).send();
};
