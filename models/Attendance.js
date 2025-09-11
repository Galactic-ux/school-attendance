import mongoose from 'mongoose';

const Entry = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: ['Present','Absent'], required: true }
}, { _id: false });

const AttendanceSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  entries: { type: [Entry], default: [] }
}, { timestamps: true });

AttendanceSchema.index({ classId: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', AttendanceSchema);
