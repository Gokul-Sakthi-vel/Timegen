import { Router } from 'express';
import {
  createFaculty,
  deleteFaculty,
  getFaculty,
  getFacultyById,
  updateFaculty,
} from '../api/faculty';

const router = Router();

router.get('/', getFaculty);
router.get('/:id', getFacultyById);
router.post('/', createFaculty);
router.put('/:id', updateFaculty);
router.delete('/:id', deleteFaculty);

export default router;
