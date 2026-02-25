import { Router } from 'express';
import { createTimetable, deleteTimetable, getTimetables, updateTimetable } from '../api/timetables';

const router = Router();

router.get('/', getTimetables);
router.post('/', createTimetable);
router.put('/:id', updateTimetable);
router.delete('/:id', deleteTimetable);

export default router;
