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
  } catch (error) {
    console.error('Payload filter failed:', error);
    return Object.fromEntries(
      Object.entries(payload).filter(([_, val]) => val !== undefined)
    );
  }
};

const normalizeFacultyPayload = (body: any) => {
  const subjects = Array.isArray(body.subjects)
    ? body.subjects
    : Array.isArray(body.subject_ids)
    ? body.subject_ids
    : [];

  const availability = Array.isArray(body.availability)
    ? body.availability
    : [];

  return {
    name: typeof body.name === 'string' ? body.name.trim() : typeof body.faculty_name === 'string' ? body.faculty_name.trim() : undefined,
    email: typeof body.email === 'string' ? body.email.trim() : undefined,
    phone: typeof body.phone === 'string' ? body.phone.trim() : undefined,
    availability,
    subjects,
    department: typeof body.department === 'string' ? body.department.trim() : undefined,
    faculty_code: typeof body.faculty_code === 'string' ? body.faculty_code.trim() : undefined,
  };
};

const validateFacultyPayload = (payload: ReturnType<typeof normalizeFacultyPayload>) => {
  const errors: string[] = [];

  if (!payload.name) {
    errors.push('Missing faculty name.');
  }
  if (!payload.email) {
    errors.push('Missing email address.');
  }
  if (payload.email && typeof payload.email === 'string' && !payload.email.includes('@')) {
    errors.push('Email must be valid.');
  }
  if (!Array.isArray(payload.subjects)) {
    errors.push('Subjects must be an array.');
  }
  if (!Array.isArray(payload.availability)) {
    errors.push('Availability must be an array.');
  }

  return errors;
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
  console.error('Faculty Save Request body:', JSON.stringify(req.body));

  try {
    const body = normalizeFacultyPayload(req.body);
    const validationErrors = validateFacultyPayload(body);

    if (validationErrors.length > 0) {
      console.error('Faculty Save Validation Failed:', validationErrors);
      return res.status(400).json({
        success: false,
        error: 'Invalid faculty payload.',
        issues: validationErrors,
      });
    }

    const rawPayload = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      availability: body.availability,
      user_id: req.userId,
    };
    const payload = await filterPayload('faculty', rawPayload);

    const { data, error } = await supabase
      .from('faculty')
      .insert([payload])
      .select('*')
      .single();

    console.error('Faculty insert response:', { data, error });

    if (error) {
      console.error('Faculty Save Supabase Insert Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        details: error,
      });
    }

    if (body.subjects && body.subjects.length > 0) {
      const joinRows = body.subjects.map(subjectId => ({
        faculty_id: data.id,
        subject_id: subjectId,
      }));
      const { error: joinError } = await supabase.from('faculty_subjects').insert(joinRows);
      console.error('Faculty subject join response:', { joinError });
      if (joinError) {
        console.error('Faculty Save Subjects Insert Error:', joinError);
        return res.status(500).json({
          success: false,
          error: joinError.message,
          details: joinError,
        });
      }
    }

    res.status(201).json({
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      availability: data.availability || [],
      subjects: body.subjects || [],
    });
  } catch (err: any) {
    console.error('Faculty Save Error:', err, { body: req.body, stack: err.stack });
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
};

export const updateFaculty = async (req: AuthRequest, res: express.Response) => {
  console.error('Faculty Update Request body:', JSON.stringify(req.body));

  try {
    const { id } = req.params;
    const incoming = normalizeFacultyPayload(req.body);
    const validationErrors = validateFacultyPayload(incoming);

    if (validationErrors.length > 0) {
      console.error('Faculty Update Validation Failed:', validationErrors, 'body:', req.body);
      return res.status(400).json({
        success: false,
        error: 'Invalid faculty payload.',
        issues: validationErrors,
      });
    }

    const rawUpdate = {
      name: incoming.name,
      email: incoming.email,
      phone: incoming.phone,
      availability: incoming.availability,
    };
    const payload = await filterPayload('faculty', rawUpdate);

    const { data, error } = await supabase
      .from('faculty')
      .update(payload)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select('*')
      .single();

    console.error('Faculty update response:', { data, error });

    if (error) {
      console.error('Faculty Update Supabase Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        details: error,
      });
    }

    const { error: clearError } = await supabase.from('faculty_subjects').delete().eq('faculty_id', id);
    console.error('Faculty update clear subjects response:', { clearError });
    if (clearError) {
      console.error('Faculty Update Clear Subjects Error:', clearError);
      return res.status(500).json({
        success: false,
        error: clearError.message,
        details: clearError,
      });
    }

    if (incoming.subjects && incoming.subjects.length > 0) {
      const joinRows = incoming.subjects.map(subjectId => ({
        faculty_id: id,
        subject_id: subjectId,
      }));
      const { error: joinError } = await supabase.from('faculty_subjects').insert(joinRows);
      console.error('Faculty update subject join response:', { joinError });
      if (joinError) {
        console.error('Faculty Update Subjects Insert Error:', joinError);
        return res.status(500).json({
          success: false,
          error: joinError.message,
          details: joinError,
        });
      }
    }

    res.json({
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      availability: data.availability || [],
      subjects: incoming.subjects || [],
    });
  } catch (err: any) {
    console.error('Faculty Update Error:', err, { body: req.body, stack: err.stack });
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
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


