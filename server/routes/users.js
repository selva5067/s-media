import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const safeUser = (user, currentUserId) => {
  const { password, ...safe } = user;
  return {
    ...safe,
    isFollowing: (user.followers || []).includes(currentUserId),
    followersCount: (user.followers || []).length,
    followingCount: (user.following || []).length,
  };
};

// Search users
router.get('/search', authenticate, async (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.json([]);
  await db.read();
  const users = db.data.users
    .filter(u => u.id !== req.user.id && (u.username.includes(q) || u.name.toLowerCase().includes(q)))
    .slice(0, 10)
    .map(u => safeUser(u, req.user.id));
  res.json(users);
});

// Get suggested users (people not followed)
router.get('/suggested', authenticate, async (req, res) => {
  await db.read();
  const me = db.data.users.find(u => u.id === req.user.id);
  const users = db.data.users
    .filter(u => u.id !== req.user.id && !(me.following || []).includes(u.id))
    .slice(0, 5)
    .map(u => safeUser(u, req.user.id));
  res.json(users);
});

// Get notifications
router.get('/notifications', authenticate, async (req, res) => {
  await db.read();
  const notifs = db.data.notifications
    .filter(n => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20)
    .map(n => {
      const from = db.data.users.find(u => u.id === n.fromUserId);
      return {
        ...n,
        from: from ? { id: from.id, username: from.username, name: from.name, avatar: from.avatar } : null,
      };
    });
  // Mark all as read
  db.data.notifications.forEach(n => { if (n.userId === req.user.id) n.read = true; });
  await db.write();
  res.json(notifs);
});

// Get unread notification count
router.get('/notifications/count', authenticate, async (req, res) => {
  await db.read();
  const count = db.data.notifications.filter(n => n.userId === req.user.id && !n.read).length;
  res.json({ count });
});

// Get user by username
router.get('/:username', authenticate, async (req, res) => {
  await db.read();
  const user = db.data.users.find(u => u.username === req.params.username.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(safeUser(user, req.user.id));
});

// Follow / unfollow
router.post('/:userId/follow', authenticate, async (req, res) => {
  if (req.params.userId === req.user.id)
    return res.status(400).json({ error: 'Cannot follow yourself' });

  await db.read();
  const me = db.data.users.find(u => u.id === req.user.id);
  const target = db.data.users.find(u => u.id === req.params.userId);
  if (!me || !target) return res.status(404).json({ error: 'User not found' });

  const alreadyFollowing = (me.following || []).includes(target.id);
  if (alreadyFollowing) {
    me.following = me.following.filter(id => id !== target.id);
    target.followers = target.followers.filter(id => id !== me.id);
  } else {
    me.following = [...(me.following || []), target.id];
    target.followers = [...(target.followers || []), me.id];
    db.data.notifications.push({
      id: uuid(),
      userId: target.id,
      fromUserId: me.id,
      type: 'follow',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
  await db.write();
  res.json({ following: !alreadyFollowing, followersCount: target.followers.length });
});

export default router;
