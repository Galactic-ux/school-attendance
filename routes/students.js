import express from 'express';
import Student from '../models/Student.js';
import User from '../models/User.js';
import ClassModel from '../models/Class.js';
import bcrypt from 'bcryptjs';
import { auth, facultyOrAdmin, adminOnly } from './utils/middleware.js';
import { spawn } from 'child_process';
const router = express.Router();

// GET students by classId
router.get('/', auth, async (req, res) => {
  const { classId } = req.query;
  const q = classId ? { classId } : {};
  const students = await Student.find(q).sort({ rollNumber: 1 });
  res.json(students);
});

// POST create student (faculty/admin). Optionally creates a linked user account.
router.post('/', auth, facultyOrAdmin, async (req, res) => {
  try {
    const { name, rollNumber, classId, createUser = true, imageData } = req.body;
    if(!name || !rollNumber || !classId) return res.status(400).json({ error: 'name, rollNumber, classId required' });

    const cls = await ClassModel.findById(classId);
    if(!cls) return res.status(400).json({ error: 'Invalid classId' });

    const student = await Student.create({ name, rollNumber, classId });

    if (imageData) {
      const pythonProcess = spawn('python', [
        'python_scripts/face_enroll.py',
        imageData,
        student._id.toString(),
      ]);

      pythonProcess.stdout.on('data', (data) => {
        console.log(`Python stdout: ${data}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data}`);
      });
    }

    let userObj = null;
    if(createUser) {
      // username: ClassName_RollNumber (no spaces)
      const username = `${cls.name.replace(/\s+/g,'')}_${String(rollNumber)}`;
      const user = new User({ username, password: 'student123', role: 'student', linkedStudentId: student._id });
      await user.save();
      userObj = { username: user.username, role: user.role, linkedStudentId: user.linkedStudentId };
    }

    res.status(201).json({ student, user: userObj });
  } catch (e) {
    // handle duplicate rollNumber per class gracefully
    if(e.code === 11000) return res.status(400).json({ error: 'Roll number already exists in this class' });
    res.status(400).json({ error: e.message });
  }
});

// DELETE student by id (admin only)
router.delete('/:studentId', auth, adminOnly, async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findByIdAndDelete(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    // Also delete the linked user account
    await User.findOneAndDelete({ linkedStudentId: studentId });
    res.json({ message: 'Student deleted successfully' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
