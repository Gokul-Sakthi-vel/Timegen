import express from 'express';
import { supabase } from '../supabase';

export interface AuthRequest extends express.Request {
  userId?: string;
  userEmail?: string;
}

export const requireAuth = async (
  req: AuthRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    req.userId = user.id;
    req.userEmail = user.email;

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Auth middleware error' });
  }
};


