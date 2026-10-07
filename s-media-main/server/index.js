import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Initialize DB (MongoDB + LowDB fallback)
await connectDB();

const dbPath = join(__dirname, 'db.json');
const adapter = new JSONFile(dbPath);
const defaultData = { users: [], posts: [], notifications: [] };
export const db = new Low(adapter, defaultData);
await db.read();
db.data ||= defaultData;
await db.write();

const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.CLIENT_URL].filter(Boolean);
app.use(cors({ origin: allowedOrigins.length === 1 && allowedOrigins[0] === '*' ? '*' : allowedOrigins, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (_, res) => res.json({
  status: 'ok',
  time: new Date(),
  database: process.env.MONGODB_URI ? 'MongoDB (Configured)' : 'LowDB/MongoDB Multi-mode',
}));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Pulse server running on http://localhost:${PORT}`));
