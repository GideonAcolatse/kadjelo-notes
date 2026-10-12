import express from 'express';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  syncLocalNotes
} from '../controllers/noteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotes);
router.post('/', createNote);
router.post('/sync', syncLocalNotes);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
