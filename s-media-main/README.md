# Pulse — Modern MERN Stack Social Media App

A full-stack social media application built with the **MERN Stack** — **MongoDB Atlas (Mongoose ORM)**, **Express.js**, **React 18 + Vite** (frontend), and **Node.js** (backend).

---

## 🔑 Sample Demo Credentials

For quick testing and demonstration, use any of the pre-configured accounts below (all passwords are `password123`):

| Username | Name | Email | Password | Role / Bio |
| :--- | :--- | :--- | :--- | :--- |
| `@alex_dev` | Alex Rivers | `alex@example.com` | `password123` | Senior Full Stack Engineer (MERN & TypeScript) |
| `@sarah_design` | Sarah Lin | `sarah@example.com` | `password123` | Product Designer & Visual Storyteller |
| `@tech_daily` | Tech Daily | `tech@example.com` | `password123` | Tech News, AI & Web Architecture |
| `@jordan_code` | Jordan Smith | `jordan@example.com` | `password123` | Open Source Maintainer & React Specialist |

---

## ✨ Key Features

- **Authentication & Security** — Register & Login using JWT tokens (7-day sessions) and salted `bcryptjs` encryption.
- **Posts & Media Attachments** — Create 280-char short-form posts with image attachments & file upload preview.
- **Likes & Comments** — Like/unlike posts in real-time, add threaded comments, or delete your comments.
- **Follow & Social Graph** — Follow users to build a personalized Home Feed, or browse all global posts in Explore.
- **Notifications** — Automatic notification system for likes, comments, and new followers.
- **User Discovery** — Instant search by `@username` or full name, with suggested user recommendations.
- **Profiles & Avatars** — Edit bio & display name, view follower/following stats, and auto-generate vector avatars via DiceBear API.
- **Database Seeding** — One-command DB seeding script for instant population of demo accounts and content.

---

## 🛠 Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, React Router 6, Vite | Fast SPA with modern CSS design system & glassmorphism |
| **Backend** | Express 4, Node.js | Modular RESTful API with Multer image upload pipeline |
| **Database** | MongoDB Atlas, Mongoose ORM | Cloud MongoDB cluster with Mongoose schemas & LowDB local fallback |
| **Authentication** | JWT + bcryptjs | Token-based auth & hashed credentials |
| **Media Storage** | Multer | Express static file uploads (`/uploads`) |

---

## 🚀 Quick Start Guide

### 1. Install Dependencies

```bash
# Install both backend and frontend dependencies from root
npm run install:all
```

### 2. Environment Setup

Create or check `server/.env`:
```env
PORT=4000
JWT_SECRET=pulse_super_secret_production_key_2026
MONGODB_URI=mongodb://usersp:5067@ac-bygzsww-shard-00-00.bjv4pyh.mongodb.net:27017,ac-bygzsww-shard-00-01.bjv4pyh.mongodb.net:27017,ac-bygzsww-shard-00-02.bjv4pyh.mongodb.net:27017/pulse_social?ssl=true&replicaSet=atlas-c6f53o-shard-0&authSource=admin&appName=Cluster0
```

### 3. Seed Database (Optional)

Pre-load sample users, posts, and comments into MongoDB:
```bash
npm run seed
```

### 4. Run Development Servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# Express API running on http://localhost:4000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# React Vite App running on http://localhost:5173
```

Visit **http://localhost:5173** and log in with any sample credential listed above!

---

## 📂 Project Structure

```
pulse-app/
├── server/
│   ├── index.js          # Express server & CORS initialization
│   ├── seed.js           # MongoDB seeding script
│   ├── .env              # Environment variables
│   ├── config/
│   │   └── db.js         # Mongoose MongoDB connection
│   ├── models/
│   │   ├── User.js       # User Mongoose Schema
│   │   ├── Post.js       # Post & Comment Schema
│   │   └── Notification.js # Notification Schema
│   ├── middleware/
│   │   └── auth.js       # JWT auth middleware
│   └── routes/
│       ├── auth.js       # /api/auth/*
│       ├── posts.js      # /api/posts/*
│       ├── users.js      # /api/users/*
│       └── upload.js     # /api/upload (Multer file upload)
│
└── client/
    ├── src/
    │   ├── App.jsx       # Routing & main layout
    │   ├── api.js        # Axios instance
    │   ├── index.css     # Design system & dark theme
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── RightPanel.jsx
    │   │   ├── PostCard.jsx
    │   │   ├── Composer.jsx (File upload enabled)
    │   │   └── Icons.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Register.jsx
    │       ├── Home.jsx
    │       ├── Explore.jsx
    │       ├── PostDetail.jsx
    │       ├── Profile.jsx
    │       └── Notifications.jsx
    └── vite.config.js
```

---

## 📡 API Endpoints Summary

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user account |
| POST | `/api/auth/login` | Login user & return JWT token |
| GET | `/api/auth/me` | Fetch authenticated user details |
| PUT | `/api/auth/me` | Update name, bio, or avatar |

### Posts & Media
| Method | Path | Description |
|---|---|---|
| GET | `/api/posts/feed` | Get followed users' posts + own |
| GET | `/api/posts/explore` | Get all global posts |
| GET | `/api/posts/:id` | Get single post details |
| POST | `/api/posts` | Create new post |
| POST | `/api/upload` | Upload image file (Multer) |
| DELETE | `/api/posts/:id` | Delete user post |
| POST | `/api/posts/:id/like` | Like or unlike post |
| POST | `/api/posts/:id/comments` | Add comment to post |
| DELETE | `/api/posts/:id/comments/:cid` | Delete comment |

### Users & Social
| Method | Path | Description |
|---|---|---|
| GET | `/api/users/search?q=` | Search users by name/username |
| GET | `/api/users/suggested` | Get recommended accounts to follow |
| GET | `/api/users/notifications` | Get user notifications & mark read |
| GET | `/api/users/notifications/count` | Unread notifications count |
| GET | `/api/users/:username` | Fetch public profile by username |
| POST | `/api/users/:userId/follow` | Follow or unfollow user |
