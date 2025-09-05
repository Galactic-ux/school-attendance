import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  faceEncoding: { type: [Number] }
}, { timestamps: true });

// unique rollNumber per class
StudentSchema.index({ classId: 1, rollNumber: 1 }, { unique: true });

export default mongoose.model('Student', StudentSchema);
