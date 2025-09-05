import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student','faculty','admin'], required: true },
  linkedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null }
}, { timestamps: true });

UserSchema.pre('save', async function(next){
  if(!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.verifyPassword = function(candidate){
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', UserSchema);
