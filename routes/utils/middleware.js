import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if(!header) return res.status(401).json({ error: 'Missing Authorization header' });
    const parts = header.split(' ');
    if(parts.length !== 2) return res.status(401).json({ error: 'Bad Authorization header' });
    const token = parts[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.userId).lean();
    if(!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function adminOnly(req, res, next) {
  if(!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if(req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

export function facultyOrAdmin(req, res, next) {
  if(!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if(req.user.role === 'faculty' || req.user.role === 'admin') return next();
  res.status(403).json({ error: 'Faculty or Admin only' });
}
