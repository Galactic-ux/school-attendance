import express from 'express';
import User from '../models/User.js';
import { auth, adminOnly } from './utils/middleware.js';
const router = express.Router();

// Create user (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { username, password, role, linkedStudentId } = req.body;
    const u = new User({ username, password, role, linkedStudentId: linkedStudentId || null });
    await u.save();
    const obj = u.toObject(); delete obj.password;
    res.status(201).json(obj);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
