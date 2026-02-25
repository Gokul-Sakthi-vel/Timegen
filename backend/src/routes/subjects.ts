import { Router } from 'express';
import {
  createSubject,
  deleteSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
} from '../api/subjects';

const router = Router();

router.get('/', getSubjects);
router.get('/:id', getSubjectById);
router.post('/', createSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

export default router;
