import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { db } from '../index.js';
import { JWT_SECRET, authenticate } from '../middleware/auth.js';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  const { username, name, email, password } = req.body;
  if (!username || !name || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });

  await db.read();
  const exists = db.data.users.find(u => u.email === email || u.username === username);
  if (exists) return res.status(409).json({ error: 'Email or username already taken' });

  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: uuid(),
    username: username.toLowerCase().trim(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashed,
    bio: '',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    following: [],
    followers: [],
    createdAt: new Date().toISOString(),
  };
  db.data.users.push(user);
  await db.write();

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safe } = user;
  res.status(201).json({ token, user: safe });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  await db.read();
  const user = db.data.users.find(u => u.email === email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safe } = user;
  res.json({ token, user: safe });
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  await db.read();
  const user = db.data.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safe } = user;
  res.json(safe);
});

// Update profile
router.put('/me', authenticate, async (req, res) => {
  const { name, bio, avatar } = req.body;
  await db.read();
  const idx = db.data.users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });

  if (name !== undefined) db.data.users[idx].name = name;
  if (bio !== undefined) db.data.users[idx].bio = bio;
  if (avatar !== undefined) db.data.users[idx].avatar = avatar;
  await db.write();

  const { password: _, ...safe } = db.data.users[idx];
  res.json(safe);
});

export default router;
