import { Router } from 'express';
import {
  createClass,
  deleteClass,
  getClasses,
  getClassById,
  updateClass,
} from '../api/classes';

const router = Router();

router.get('/', getClasses);
router.get('/:id', getClassById);
router.post('/', createClass);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

export default router;
