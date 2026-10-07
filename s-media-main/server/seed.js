import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuid } from 'uuid';
import User from './models/User.js';
import Post from './models/Post.js';
import Notification from './models/Notification.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const sampleUsers = [
  {
    username: 'alex_dev',
    name: 'Alex Rivers',
    email: 'alex@example.com',
    password: 'password123',
    bio: '⚡ Senior Full Stack Engineer | MERN, TypeScript, Node.js enthusiast. Building scalable web apps.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex_dev',
  },
  {
    username: 'sarah_design',
    name: 'Sarah Lin',
    email: 'sarah@example.com',
    password: 'password123',
    bio: '🎨 Product Designer & Visual Storyteller. Obsessed with clean UI, micro-animations, and glassmorphism.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah_design',
  },
  {
    username: 'tech_daily',
    name: 'Tech Daily',
    email: 'tech@example.com',
    password: 'password123',
    bio: '🚀 Breaking news in Web Development, Artificial Intelligence, and Modern Software Architecture.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech_daily',
  },
  {
    username: 'jordan_code',
    name: 'Jordan Smith',
    email: 'jordan@example.com',
    password: 'password123',
    bio: '☕ Open Source Maintainer & Coffee addict. Love Vite, React 18, and MongoDB indexing.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan_code',
  },
];

async function seed() {
  console.log('🌱 Starting database seeding process...');

  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pulse_social';
  let isMongoConnected = false;

  try {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 });
    isMongoConnected = true;
    console.log('🍃 Connected to MongoDB for seeding.');
  } catch {
    console.log('⚠️ MongoDB not available. Seeding LowDB local database file...');
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  if (isMongoConnected) {
    await User.deleteMany({});
    await Post.deleteMany({});
    await Notification.deleteMany({});

    const createdUsers = [];
    for (const u of sampleUsers) {
      const userDoc = new User({
        ...u,
        password: hashedPassword,
      });
      await userDoc.save();
      createdUsers.push(userDoc);
    }

    // Set up followings
    createdUsers[0].following.push(createdUsers[1]._id, createdUsers[2]._id);
    createdUsers[1].following.push(createdUsers[0]._id, createdUsers[3]._id);
    createdUsers[2].following.push(createdUsers[0]._id);
    createdUsers[3].following.push(createdUsers[0]._id, createdUsers[1]._id);

    createdUsers[0].followers.push(createdUsers[1]._id, createdUsers[2]._id, createdUsers[3]._id);
    createdUsers[1].followers.push(createdUsers[0]._id, createdUsers[3]._id);

    for (const u of createdUsers) await u.save();

    // Create sample posts
    const post1 = new Post({
      author: createdUsers[0]._id,
      content: '🚀 Excited to announce the newly upgraded Pulse Social Media platform! Built on MERN stack with MongoDB, Express, React, and Node.js. Check out the dark aesthetics!',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      likes: [createdUsers[1]._id, createdUsers[2]._id, createdUsers[3]._id],
      comments: [
        { author: createdUsers[1]._id, content: 'Looks incredibly slick! Great job on the UI transitions 🔥' },
        { author: createdUsers[2]._id, content: 'MERN stack is rock solid. Loving the dark mode design system.' },
      ],
    });

    const post2 = new Post({
      author: createdUsers[1]._id,
      content: '✨ UI Tip of the day: When designing dark mode interfaces, prefer high contrast slate backgrounds over pure pitch black (#000000) for reduce eye fatigue!',
      image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
      likes: [createdUsers[0]._id, createdUsers[3]._id],
      comments: [
        { author: createdUsers[0]._id, content: '100% agreed! Using slate neutrals (#0f172a / #1e293b) makes text pop smoothly.' },
      ],
    });

    const post3 = new Post({
      author: createdUsers[2]._id,
      content: '🤖 AI & Full-Stack Development in 2026: Neural engines and standard web tech are merging into seamless real-time applications. Are you building with MERN?',
      image: null,
      likes: [createdUsers[0]._id, createdUsers[1]._id],
      comments: [],
    });

    await post1.save();
    await post2.save();
    await post3.save();

    console.log('✅ MongoDB Seed completed successfully with demo users and posts!');
    process.exit(0);
  } else {
    // LowDB Seeding
    const dbPath = join(__dirname, 'db.json');
    const adapter = new JSONFile(dbPath);
    const db = new Low(adapter, { users: [], posts: [], notifications: [] });
    await db.read();

    const lowUsers = sampleUsers.map(u => ({
      id: uuid(),
      username: u.username,
      name: u.name,
      email: u.email,
      password: hashedPassword,
      bio: u.bio,
      avatar: u.avatar,
      following: [],
      followers: [],
      createdAt: new Date().toISOString(),
    }));

    lowUsers[0].following = [lowUsers[1].id, lowUsers[2].id];
    lowUsers[1].following = [lowUsers[0].id, lowUsers[3].id];
    lowUsers[0].followers = [lowUsers[1].id, lowUsers[2].id, lowUsers[3].id];

    const lowPosts = [
      {
        id: uuid(),
        authorId: lowUsers[0].id,
        content: '🚀 Excited to announce the newly upgraded Pulse Social Media platform! Built on MERN stack with MongoDB, Express, React, and Node.js. Check out the dark aesthetics!',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        likes: [lowUsers[1].id, lowUsers[2].id],
        comments: [
          {
            id: uuid(),
            authorId: lowUsers[1].id,
            author: { id: lowUsers[1].id, username: lowUsers[1].username, name: lowUsers[1].name, avatar: lowUsers[1].avatar },
            content: 'Looks incredibly slick! Great job on the UI transitions 🔥',
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: uuid(),
        authorId: lowUsers[1].id,
        content: '✨ UI Tip of the day: When designing dark mode interfaces, prefer high contrast slate backgrounds over pure pitch black (#000000) to reduce eye fatigue!',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
        likes: [lowUsers[0].id],
        comments: [],
        createdAt: new Date().toISOString(),
      },
    ];

    db.data = {
      users: lowUsers,
      posts: lowPosts,
      notifications: [],
    };
    await db.write();

    console.log('✅ LowDB Seed completed successfully!');
    process.exit(0);
  }
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
