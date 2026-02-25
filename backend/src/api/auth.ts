import { Request, Response } from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { supabase } from '../supabase';

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
};

const verifyPassword = (password: string, stored: string) => {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }

  const [, salt, originalHashHex] = parts;
  const calculatedHash = scryptSync(password, salt, 64);
  const originalHash = Buffer.from(originalHashHex, 'hex');

  if (originalHash.length !== calculatedHash.length) {
    return false;
  }

  return timingSafeEqual(originalHash, calculatedHash);
};

export const signup = async (req: Request, res: Response) => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const { data: existingUser, error: existingError } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingError) {
    return res.status(500).json({ error: existingError.message });
  }

  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const passwordHash = hashPassword(password);

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email: normalizedEmail, password: passwordHash }])
    .select('id, name, email')
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data);
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, password')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data || !verifyPassword(password, data.password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  return res.json({ id: data.id, name: data.name, email: data.email });
};
