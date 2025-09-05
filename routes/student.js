import express from 'express';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import { auth } from './utils/middleware.js';
const router = express.Router();

// GET /api/student/me
router.get('/me', auth, async (req, res) => {
  try {
    if(!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if(req.user.role !== 'student') return res.status(403).json({ error: 'Not a student' });

    const studentId = req.user.linkedStudentId;
    if(!studentId) return res.status(400).json({ error: 'No linked student record' });

    const student = await Student.findById(studentId).populate('classId').lean();
    const attendance = await Attendance.find({ 'entries.studentId': studentId }).sort({ date: -1 }).lean();

    res.json({ student, attendance });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
