# Pulse — Social Media App

A full-stack social media application built with **React + Vite** (frontend) and **Express + lowdb** (backend).

---

## Features

- **Auth** — Register & login with JWT (7-day sessions)
- **Posts** — Create, delete, like/unlike posts (280 char limit)
- **Comments** — Comment on any post, delete your own comments
- **Follow / Unfollow** — Follow people and see their posts in your feed
- **Feed** — Home feed (followed users) + Explore (all posts)
- **Profiles** — Edit your name & bio, view anyone's profile
- **Notifications** — Likes, comments, and follows in real time
- **Search** — Find users by name or username
- **Suggestions** — Discover new people to follow

---

## Tech Stack

| Layer    | Tech                     |
|----------|--------------------------|
| Frontend | React 18, React Router 6, Vite |
| Backend  | Express 4, lowdb 7 (JSON DB) |
| Auth     | JWT (jsonwebtoken) + bcryptjs |
| Avatars  | DiceBear (auto-generated) |

---

## Quick Start

### 1. Install dependencies

```bash
# From the project root
npm run install:all

# Or manually:
cd server && npm install
cd ../client && npm install
```

### 2. Start the backend (Terminal 1)

```bash
cd server
npm run dev
# Runs on http://localhost:4000
```

### 3. Start the frontend (Terminal 2)

```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

### 4. Open your browser

Visit **http://localhost:5173** and create an account!

---

## Project Structure

```
pulse-app/
├── server/
│   ├── index.js          # Express app + DB init
│   ├── db.json           # Auto-created JSON database
│   ├── middleware/
│   │   └── auth.js       # JWT middleware
│   └── routes/
│       ├── auth.js       # /api/auth/*
│       ├── posts.js      # /api/posts/*
│       └── users.js      # /api/users/*
│
└── client/
    ├── src/
    │   ├── App.jsx       # Routes + layout
    │   ├── api.js        # Axios instance
    │   ├── index.css     # Design system
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── RightPanel.jsx
    │   │   ├── PostCard.jsx
    │   │   ├── Composer.jsx
    │   │   ├── Icons.jsx
    │   │   └── Toast.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── hooks/
    │   │   └── useToast.js
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

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |

### Posts
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/posts/feed` | Get home feed |
| GET | `/api/posts/explore` | Get all posts |
| GET | `/api/posts/:id` | Get single post |
| POST | `/api/posts` | Create post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/like` | Like / unlike |
| POST | `/api/posts/:id/comments` | Add comment |
| DELETE | `/api/posts/:id/comments/:cid` | Delete comment |
| GET | `/api/posts/user/:userId` | Get user's posts |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/search?q=` | Search users |
| GET | `/api/users/suggested` | Suggested users |
| GET | `/api/users/notifications` | Get notifications |
| GET | `/api/users/notifications/count` | Unread count |
| GET | `/api/users/:username` | Get user profile |
| POST | `/api/users/:userId/follow` | Follow / unfollow |

---

## Notes

- The database is a flat JSON file (`server/db.json`) — no setup needed
- Avatars are auto-generated via DiceBear based on username
- JWT secret is set in `server/middleware/auth.js` — use an env var in production
