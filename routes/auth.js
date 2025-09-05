import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if(!username || !password) return res.status(400).json({ error: 'username and password required' });

    const user = await User.findOne({ username });
    if(!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if(!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, role: user.role, linkedStudentId: user.linkedStudentId || null }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, role: user.role, username: user.username, linkedStudentId: user.linkedStudentId || null });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
