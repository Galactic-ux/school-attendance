import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import studentsRouter from './routes/students.js';
import attendanceRouter from './routes/attendance.js';
import classesRouter from './routes/classes.js';
import studentRouter from './routes/student.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/students', studentsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/classes', classesRouter);
app.use('/api/student', studentRouter);

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance_app';

console.log("Connecting to MONGO_URI:", process.env.MONGO_URI);
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>{
    console.log('✅ MongoDB connected');
  })
  .catch(err=>{ console.error('MongoDB connection error:', err); process.exit(1);} );

export default app;
