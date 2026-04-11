import express from "express";
import {
  createRoom,
  deleteRoom,
  getRooms,
  getRoomById,
  updateRoom,
} from '../api/rooms';

const router = express.Router();

router.get('/', getRooms);
router.get('/:id', getRoomById);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);
router.delete('/', deleteRoom);

export default router;



