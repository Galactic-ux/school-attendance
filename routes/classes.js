import express from 'express';
import ClassModel from '../models/Class.js';
import { auth } from './utils/middleware.js';
const router = express.Router();

router.get('/', auth, async (req, res) => {
  const classes = await ClassModel.find().sort({ name: 1 });
  res.json(classes);
});

router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const c = await ClassModel.create({ name });
    res.status(201).json(c);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
