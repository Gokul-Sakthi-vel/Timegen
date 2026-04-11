import express from "express";
import {
  createSubject,
  deleteSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
} from '../api/subjects';

const router = express.Router();

router.get('/', getSubjects);
router.get('/:id', getSubjectById);
router.post('/', createSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);
router.delete('/', deleteSubject);

export default router;



