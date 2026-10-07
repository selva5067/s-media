import { Router } from 'express';
import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';
import { db } from '../index.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const isMongoActive = () => mongoose.connection.readyState === 1;

const formatMongoUser = (user, currentUserId) => {
  const uObj = user.toObject ? user.toObject({ virtuals: true }) : user;
  const followersList = (uObj.followers || []).map(f => (f._id || f).toString());
  const followingList = (uObj.following || []).map(f => (f._id || f).toString());

  return {
    id: (uObj._id || uObj.id).toString(),
    username: uObj.username,
    name: uObj.name,
    email: uObj.email,
    bio: uObj.bio || '',
    avatar: uObj.avatar,
    followers: followersList,
    following: followingList,
    followersCount: followersList.length,
    followingCount: followingList.length,
    isFollowing: followersList.includes(currentUserId),
    createdAt: uObj.createdAt,
  };
};

const safeLowdbUser = (user, currentUserId) => {
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
  try {
    const q = (req.query.q || '').toLowerCase();
    if (!q) return res.json([]);

    if (isMongoActive()) {
      const users = await User.find({
        _id: { $ne: req.user.id },
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
        ],
      }).limit(10);

      const formatted = users.map(u => formatMongoUser(u, req.user.id));
      return res.json(formatted);
    } else {
      await db.read();
      const users = db.data.users
        .filter(u => u.id !== req.user.id && (u.username.includes(q) || u.name.toLowerCase().includes(q)))
        .slice(0, 10)
        .map(u => safeLowdbUser(u, req.user.id));
      return res.json(users);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get suggested users (people not followed)
router.get('/suggested', authenticate, async (req, res) => {
  try {
    if (isMongoActive()) {
      const me = await User.findById(req.user.id);
      if (!me) return res.status(404).json({ error: 'User not found' });

      const excludedIds = [...(me.following || []), me._id];
      const users = await User.find({ _id: { $nin: excludedIds } }).limit(5);

      const formatted = users.map(u => formatMongoUser(u, req.user.id));
      return res.json(formatted);
    } else {
      await db.read();
      const me = db.data.users.find(u => u.id === req.user.id);
      const users = db.data.users
        .filter(u => u.id !== req.user.id && !(me?.following || []).includes(u.id))
        .slice(0, 5)
        .map(u => safeLowdbUser(u, req.user.id));
      return res.json(users);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    if (isMongoActive()) {
      const notifs = await Notification.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('fromUser', 'username name avatar');

      const formatted = notifs.map(n => ({
        id: n._id.toString(),
        userId: n.user.toString(),
        fromUserId: n.fromUser ? n.fromUser._id.toString() : null,
        type: n.type,
        postId: n.post ? n.post.toString() : null,
        read: n.read,
        createdAt: n.createdAt,
        from: n.fromUser ? {
          id: n.fromUser._id.toString(),
          username: n.fromUser.username,
          name: n.fromUser.name,
          avatar: n.fromUser.avatar,
        } : null,
      }));

      // Mark all as read
      await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
      return res.json(formatted);
    } else {
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
      return res.json(notifs);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get unread notification count
router.get('/notifications/count', authenticate, async (req, res) => {
  try {
    if (isMongoActive()) {
      const count = await Notification.countDocuments({ user: req.user.id, read: false });
      return res.json({ count });
    } else {
      await db.read();
      const count = db.data.notifications.filter(n => n.userId === req.user.id && !n.read).length;
      return res.json({ count });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get user by username
router.get('/:username', authenticate, async (req, res) => {
  try {
    if (isMongoActive()) {
      const user = await User.findOne({ username: req.params.username.toLowerCase() });
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json(formatMongoUser(user, req.user.id));
    } else {
      await db.read();
      const user = db.data.users.find(u => u.username === req.params.username.toLowerCase());
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json(safeLowdbUser(user, req.user.id));
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Follow / unfollow
router.post('/:userId/follow', authenticate, async (req, res) => {
  try {
    if (req.params.userId === req.user.id)
      return res.status(400).json({ error: 'Cannot follow yourself' });

    if (isMongoActive()) {
      const me = await User.findById(req.user.id);
      let target = await User.findById(req.params.userId);
      if (!target && !mongoose.Types.ObjectId.isValid(req.params.userId)) {
        target = await User.findOne({ username: req.params.userId.toLowerCase() });
      }

      if (!me || !target) return res.status(404).json({ error: 'User not found' });

      const targetIdStr = target._id.toString();
      const alreadyFollowing = (me.following || []).some(id => id.toString() === targetIdStr);

      if (alreadyFollowing) {
        me.following = me.following.filter(id => id.toString() !== targetIdStr);
        target.followers = target.followers.filter(id => id.toString() !== me._id.toString());
      } else {
        me.following.push(target._id);
        target.followers.push(me._id);

        const notif = new Notification({
          user: target._id,
          fromUser: me._id,
          type: 'follow',
        });
        await notif.save();
      }

      await me.save();
      await target.save();

      return res.json({ following: !alreadyFollowing, followersCount: target.followers.length });
    } else {
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
      return res.json({ following: !alreadyFollowing, followersCount: target.followers.length });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
