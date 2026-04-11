import express from "express";
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../supabase';

const generateFallbackCode = () => `SUB${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

export const getSubjects = async (req: AuthRequest, res: express.Response) => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', req.userId)
    .order('name', { ascending: true });
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
};

export const getSubjectById = async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('subjects').select('*').eq('id', id).eq('user_id', req.userId).single();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: 'Subject not found' });
  }
  res.json(data);
};

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

export const createSubject = async (req: AuthRequest, res: express.Response) => {
  try {
    const { name, code, hours, priority, color, subjectType, credits, weeklyPeriods, isFixed } = req.body;

    if (!name || typeof hours !== 'number') {
      return res
        .status(400)
        .json({ error: 'name and numeric hours are required.' });
    }

    const normalizedCode = (typeof code === 'string' && code.trim().length > 0)
      ? code.trim().toUpperCase()
      : generateFallbackCode();

    const rawPayload: Record<string, unknown> = {
      name,
      code: normalizedCode,
      hours,
      credits,
      priority,
      color: color || 'bg-blue-500',
      subject_type: subjectType || 'Theory',
      weekly_periods: weeklyPeriods ?? hours,
      is_fixed: isFixed ?? false,
      user_id: req.userId,
    };

    const payload = await filterPayload('subjects', rawPayload);

    const { data, error } = await supabase
      .from('subjects')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

export const updateSubject = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const { name, code, hours, priority, color, subjectType, credits, weeklyPeriods, isFixed } = req.body;
    
    const rawUpdate: Record<string, unknown> = {
      name,
      code: typeof code === 'string' && code.trim().length > 0 ? code.trim().toUpperCase() : undefined,
      hours,
      credits,
      weekly_periods: weeklyPeriods,
      is_fixed: isFixed,
      priority,
      color,
      subject_type: subjectType,
    };

    const cleanedPayload = Object.fromEntries(
      Object.entries(rawUpdate).filter(([, value]) => value !== undefined)
    );

    const payload = await filterPayload('subjects', cleanedPayload);

    const { data, error } = await supabase
      .from('subjects')
      .update(payload)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

export const deleteSubject = async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const ids = req.query.ids as string;

  if (ids) {
    const idList = ids.split(',');
    const { error } = await supabase.from('subjects').delete().in('id', idList).eq('user_id', req.userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).send();
  }

  const { error } = await supabase.from('subjects').delete().eq('id', id).eq('user_id', req.userId);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(204).send();
};


