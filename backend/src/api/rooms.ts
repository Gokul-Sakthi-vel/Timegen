import express from "express";
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../supabase';

export const getRooms = async (req: AuthRequest, res: express.Response) => {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('user_id', req.userId)
    .order('name', { ascending: true });
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
};

export const getRoomById = async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('rooms').select('*').eq('id', id).eq('user_id', req.userId).single();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(data);
};

export const createRoom = async (req: AuthRequest, res: express.Response) => {
  try {
    const { name, capacity, type } = req.body as {
      name?: string;
      capacity?: number;
      type?: 'Classroom' | 'Lab';
    };

    if (!name || typeof capacity !== 'number' || !type) {
      return res.status(400).json({ error: 'name, capacity, and type are required.' });
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert([{ name, capacity, type, user_id: req.userId }])
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

export const updateRoom = async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const { name, capacity, type } = req.body as {
      name?: string;
      capacity?: number;
      type?: 'Classroom' | 'Lab';
    };

    const { data, error } = await supabase
      .from('rooms')
      .update({ name, capacity, type })
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

export const deleteRoom = async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const ids = req.query.ids as string;

  if (ids) {
    const idList = ids.split(',');
    const { error } = await supabase.from('rooms').delete().in('id', idList).eq('user_id', req.userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).send();
  }

  const { error } = await supabase.from('rooms').delete().eq('id', id).eq('user_id', req.userId);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(204).send();
};


