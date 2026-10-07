import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';
import { db } from '../index.js';
import User from '../models/User.js';
import { JWT_SECRET, authenticate } from '../middleware/auth.js';

const router = Router();

const isMongoActive = () => mongoose.connection.readyState === 1;

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, name, email, password } = req.body;
    if (!username || !name || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });

    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    if (isMongoActive()) {
      const exists = await User.findOne({
        $or: [{ email: cleanEmail }, { username: cleanUsername }],
      });
      if (exists) return res.status(409).json({ error: 'Email or username already taken' });

      const hashed = await bcrypt.hash(password, 10);
      const user = new User({
        username: cleanUsername,
        name: cleanName,
        email: cleanEmail,
        password: hashed,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
      });
      await user.save();

      const token = jwt.sign({ id: user._id.toString(), username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ token, user: user.toJSON() });
    } else {
      // LowDB fallback
      await db.read();
      const exists = db.data.users.find(u => u.email === cleanEmail || u.username === cleanUsername);
      if (exists) return res.status(409).json({ error: 'Email or username already taken' });

      const hashed = await bcrypt.hash(password, 10);
      const user = {
        id: uuid(),
        username: cleanUsername,
        name: cleanName,
        email: cleanEmail,
        password: hashed,
        bio: '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
        following: [],
        followers: [],
        createdAt: new Date().toISOString(),
      };
      db.data.users.push(user);
      await db.write();

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      const { password: _, ...safe } = user;
      return res.status(201).json({ token, user: safe });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const cleanEmail = email.toLowerCase().trim();

    if (isMongoActive()) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user._id.toString(), username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: user.toJSON() });
    } else {
      await db.read();
      const user = db.data.users.find(u => u.email === cleanEmail);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      const { password: _, ...safe } = user;
      return res.json({ token, user: safe });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    if (isMongoActive()) {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json(user.toJSON());
    } else {
      await db.read();
      const user = db.data.users.find(u => u.id === req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { password: _, ...safe } = user;
      return res.json(safe);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put('/me', authenticate, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;

    if (isMongoActive()) {
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (bio !== undefined) updates.bio = bio;
      if (avatar !== undefined) updates.avatar = avatar;

      const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json(user.toJSON());
    } else {
      await db.read();
      const idx = db.data.users.findIndex(u => u.id === req.user.id);
      if (idx === -1) return res.status(404).json({ error: 'User not found' });

      if (name !== undefined) db.data.users[idx].name = name;
      if (bio !== undefined) db.data.users[idx].bio = bio;
      if (avatar !== undefined) db.data.users[idx].avatar = avatar;
      await db.write();

      const { password: _, ...safe } = db.data.users[idx];
      return res.json(safe);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
