import express from "express";
import {
  createClass,
  deleteClass,
  getClasses,
  getClassById,
  updateClass,
} from '../api/classes';

const router = express.Router();

router.get('/', getClasses);
router.get('/:id', getClassById);
router.post('/', createClass);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);
router.delete('/', deleteClass);

export default router;



