import express from 'express';
import { registerUser, loginUser, getCurrentUser, getOrCreateAnonymousSession } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/anonymous', getOrCreateAnonymousSession);
router.get('/me', protect, getCurrentUser);

export default router;
