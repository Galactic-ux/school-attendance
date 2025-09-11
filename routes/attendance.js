import express from 'express';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import { auth, facultyOrAdmin } from './utils/middleware.js';
import { spawn } from 'child_process';
const router = express.Router();

// GET attendance for class + date
router.get('/', auth, async (req, res) => {
  const { classId, date } = req.query;
  if(!classId || !date) return res.status(400).json({ error: 'classId and date are required' });
  const doc = await Attendance.findOne({ classId, date }).lean();
  res.json(doc || null);
});

// POST upsert attendance for class + date (faculty/admin)
router.post('/', auth, facultyOrAdmin, async (req, res) => {
  try {
    const { classId, date, entries } = req.body;
    if(!classId || !date || !Array.isArray(entries)) return res.status(400).json({ error: 'classId,date,entries required' });
    const doc = await Attendance.findOneAndUpdate({ classId, date }, { $set: { entries } }, { new: true, upsert: true });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET attendance documents for a given student across dates
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const docs = await Attendance.find({ 'entries.studentId': studentId }).sort({ date: -1 });
    res.json(docs);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/attendance/face
router.post('/face', auth, facultyOrAdmin, async (req, res) => {
  try {
    const { classId, imageData, date } = req.body;
    if (!classId || !imageData || !date) {
      return res.status(400).json({ error: 'classId, imageData, and date are required' });
    }

    const runPythonScript = () => {
      return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['python_scripts/face_recognize.py', imageData, classId]);
        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code === 0) {
            resolve(stdout.trim());
          } else {
            reject(new Error(stderr.trim()));
          }
        });
      });
    };

    const result = await runPythonScript();

    if (result.startsWith('MATCH:')) {
      const studentId = result.split(':')[1];
      const student = await Student.findById(studentId);
      
      // Mark student as present
      const entry = { studentId, status: 'Present' };
      await Attendance.findOneAndUpdate(
        { classId, date },
        { $pull: { entries: { studentId: studentId } } },
        { new: true }
      );
      const doc = await Attendance.findOneAndUpdate(
        { classId, date },
        { $addToSet: { entries: entry } },
        { new: true, upsert: true }
      );
      
      res.json({ message: `Attendance for ${student.name} marked as Present`, studentId, doc });
    } else if (result === 'NOMATCH') {
      res.status(404).json({ error: 'No matching student found' });
    } else if (result === 'NOFACE') {
      res.status(400).json({ error: 'No face detected in the image' });
    } else {
      res.status(500).json({ error: 'Error recognizing face', details: result });
    }

  } catch (e) {
    res.status(500).json({ error: 'Error in face recognition script', details: e.message });
  }
});

// Download attendance as CSV for a specific class and date
router.get('/download/:classId/:date', auth, async (req, res) => {
    try {
        const { classId, date } = req.params;
        console.log(`Received request for classId: ${classId}, date: ${date}`);

        const attendanceRecord = await Attendance.findOne({ classId, date })
            .populate('classId', 'name') // Populate the class details
            .populate('entries.studentId', 'name studentId'); // Populate student details within entries

        if (!attendanceRecord) {
            return res.status(404).json({ message: 'No attendance record found for this class and date.' });
        }

        const className = attendanceRecord.classId.name;
        const formattedDate = new Date(date).toLocaleDateString().replace(/\//g, '-');

        // Prepare CSV header
        let csv = 'Student Name,Student ID,Class Name,Date,Status,Timestamp\n';

        // Add attendance records to CSV
        const recordDate = new Date(attendanceRecord.date).toLocaleDateString();
        const timestamp = new Date(attendanceRecord.updatedAt).toLocaleString();
        attendanceRecord.entries.forEach(entry => {
            const studentName = entry.studentId ? entry.studentId.name : 'N/A';
            const studentId = entry.studentId ? entry.studentId.studentId : 'N/A';
            const status = entry.status || 'N/A';
            csv += `${studentName},${studentId},${className},${recordDate},${status},${timestamp}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`${className}_${formattedDate}.csv`);
        res.send(csv);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
