import express from "express";
import { login, signup, updateProfile } from '../api/auth';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.put('/profile', requireAuth, updateProfile);

export default router;



