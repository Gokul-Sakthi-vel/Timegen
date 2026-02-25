import { Request, Response } from 'express';
import { supabase } from '../supabase';

export const getRooms = async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('name', { ascending: true });
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
};

export const getRoomById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('rooms').select('*').eq('id', id).single();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(data);
};

export const createRoom = async (req: Request, res: Response) => {
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
    .insert([{ name, capacity, type }])
    .select('*')
    .single();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json(data);
};

export const updateRoom = async (req: Request, res: Response) => {
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
    .select('*')
    .single();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
};

export const deleteRoom = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(204).send();
};
