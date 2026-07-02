import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const enrichPost = (post, users, currentUserId) => {
  const author = users.find(u => u.id === post.authorId);
  return {
    ...post,
    author: author ? { id: author.id, username: author.username, name: author.name, avatar: author.avatar } : null,
    liked: post.likes.includes(currentUserId),
    likesCount: post.likes.length,
    commentsCount: post.comments.length,
  };
};

// Get feed (posts from followed users + own)
router.get('/feed', authenticate, async (req, res) => {
  await db.read();
  const me = db.data.users.find(u => u.id === req.user.id);
  if (!me) return res.status(404).json({ error: 'User not found' });

  const feedIds = [...(me.following || []), me.id];
  const posts = db.data.posts
    .filter(p => feedIds.includes(p.authorId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(p => enrichPost(p, db.data.users, me.id));

  res.json(posts);
});

// Get all posts (explore)
router.get('/explore', authenticate, async (req, res) => {
  await db.read();
  const posts = db.data.posts
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(p => enrichPost(p, db.data.users, req.user.id));
  res.json(posts);
});

// Get single post
router.get('/:id', authenticate, async (req, res) => {
  await db.read();
  const post = db.data.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(enrichPost(post, db.data.users, req.user.id));
});

// Create post
router.post('/', authenticate, async (req, res) => {
  const { content, image } = req.body;
  if (!content || !content.trim())
    return res.status(400).json({ error: 'Content is required' });

  await db.read();
  const post = {
    id: uuid(),
    authorId: req.user.id,
    content: content.trim(),
    image: image || null,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString(),
  };
  db.data.posts.push(post);
  await db.write();
  res.status(201).json(enrichPost(post, db.data.users, req.user.id));
});

// Delete post
router.delete('/:id', authenticate, async (req, res) => {
  await db.read();
  const idx = db.data.posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });
  if (db.data.posts[idx].authorId !== req.user.id)
    return res.status(403).json({ error: 'Not your post' });
  db.data.posts.splice(idx, 1);
  await db.write();
  res.json({ success: true });
});

// Like / unlike post
router.post('/:id/like', authenticate, async (req, res) => {
  await db.read();
  const post = db.data.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const likedIdx = post.likes.indexOf(req.user.id);
  if (likedIdx === -1) {
    post.likes.push(req.user.id);
    // Notification
    if (post.authorId !== req.user.id) {
      db.data.notifications.push({
        id: uuid(),
        userId: post.authorId,
        fromUserId: req.user.id,
        type: 'like',
        postId: post.id,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  } else {
    post.likes.splice(likedIdx, 1);
  }
  await db.write();
  res.json({ liked: likedIdx === -1, likesCount: post.likes.length });
});

// Add comment
router.post('/:id/comments', authenticate, async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim())
    return res.status(400).json({ error: 'Comment cannot be empty' });

  await db.read();
  const post = db.data.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const commenter = db.data.users.find(u => u.id === req.user.id);
  const comment = {
    id: uuid(),
    authorId: req.user.id,
    author: { id: commenter.id, username: commenter.username, name: commenter.name, avatar: commenter.avatar },
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
  post.comments.push(comment);

  if (post.authorId !== req.user.id) {
    db.data.notifications.push({
      id: uuid(),
      userId: post.authorId,
      fromUserId: req.user.id,
      type: 'comment',
      postId: post.id,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
  await db.write();
  res.status(201).json(comment);
});

// Delete comment
router.delete('/:id/comments/:commentId', authenticate, async (req, res) => {
  await db.read();
  const post = db.data.posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const idx = post.comments.findIndex(c => c.id === req.params.commentId);
  if (idx === -1) return res.status(404).json({ error: 'Comment not found' });
  if (post.comments[idx].authorId !== req.user.id && post.authorId !== req.user.id)
    return res.status(403).json({ error: 'Not authorized' });
  post.comments.splice(idx, 1);
  await db.write();
  res.json({ success: true });
});

// Get user posts
router.get('/user/:userId', authenticate, async (req, res) => {
  await db.read();
  const posts = db.data.posts
    .filter(p => p.authorId === req.params.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(p => enrichPost(p, db.data.users, req.user.id));
  res.json(posts);
});

export default router;
