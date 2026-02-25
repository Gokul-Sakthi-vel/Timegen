import { Router } from 'express';
import {
  createRoom,
  deleteRoom,
  getRooms,
  getRoomById,
  updateRoom,
} from '../api/rooms';

const router = Router();

router.get('/', getRooms);
router.get('/:id', getRoomById);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);

export default router;
