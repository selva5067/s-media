import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import userRoutes from './routes/users.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// DB setup
const dbPath = join(__dirname, 'db.json');
const adapter = new JSONFile(dbPath);
const defaultData = { users: [], posts: [], notifications: [] };
export const db = new Low(adapter, defaultData);
await db.read();
db.data ||= defaultData;
await db.write();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Pulse server running on http://localhost:${PORT}`));
