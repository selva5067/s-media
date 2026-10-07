import { Router } from 'express';
import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';
import { db } from '../index.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const isMongoActive = () => mongoose.connection.readyState === 1;

const formatMongoPost = (post, currentUserId) => {
  const postObj = post.toObject ? post.toObject({ virtuals: true }) : post;
  const liked = (postObj.likes || []).some(l => (l._id || l).toString() === currentUserId);

  let author = null;
  if (postObj.author) {
    author = {
      id: (postObj.author._id || postObj.author.id || postObj.author).toString(),
      username: postObj.author.username || '',
      name: postObj.author.name || '',
      avatar: postObj.author.avatar || '',
    };
  }

  const comments = (postObj.comments || []).map(c => {
    let commentAuthor = null;
    if (c.author && typeof c.author === 'object') {
      commentAuthor = {
        id: (c.author._id || c.author.id || c.author).toString(),
        username: c.author.username || '',
        name: c.author.name || '',
        avatar: c.author.avatar || '',
      };
    }
    return {
      id: (c._id || c.id).toString(),
      authorId: c.author ? (c.author._id || c.author.id || c.author).toString() : '',
      author: commentAuthor,
      content: c.content,
      createdAt: c.createdAt,
    };
  });

  return {
    id: (postObj._id || postObj.id).toString(),
    authorId: author ? author.id : '',
    author,
    content: postObj.content,
    image: postObj.image || null,
    likes: (postObj.likes || []).map(l => (l._id || l).toString()),
    liked,
    likesCount: (postObj.likes || []).length,
    comments,
    commentsCount: comments.length,
    createdAt: postObj.createdAt,
  };
};

const enrichLowdbPost = (post, users, currentUserId) => {
  const author = users.find(u => u.id === post.authorId);
  return {
    ...post,
    author: author ? { id: author.id, username: author.username, name: author.name, avatar: author.avatar } : null,
    liked: (post.likes || []).includes(currentUserId),
    likesCount: (post.likes || []).length,
    commentsCount: (post.comments || []).length,
  };
};

// Get feed (posts from followed users + own)
router.get('/feed', authenticate, async (req, res) => {
  try {
    if (isMongoActive()) {
      const me = await User.findById(req.user.id);
      if (!me) return res.status(404).json({ error: 'User not found' });

      const feedUserIds = [...(me.following || []), me._id];
      const posts = await Post.find({ author: { $in: feedUserIds } })
        .sort({ createdAt: -1 })
        .populate('author', 'username name avatar')
        .populate('comments.author', 'username name avatar');

      const formatted = posts.map(p => formatMongoPost(p, req.user.id));
      return res.json(formatted);
    } else {
      await db.read();
      const me = db.data.users.find(u => u.id === req.user.id);
      if (!me) return res.status(404).json({ error: 'User not found' });

      const feedIds = [...(me.following || []), me.id];
      const posts = db.data.posts
        .filter(p => feedIds.includes(p.authorId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(p => enrichLowdbPost(p, db.data.users, me.id));

      return res.json(posts);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get all posts (explore)
router.get('/explore', authenticate, async (req, res) => {
  try {
    if (isMongoActive()) {
      const posts = await Post.find()
        .sort({ createdAt: -1 })
        .populate('author', 'username name avatar')
        .populate('comments.author', 'username name avatar');

      const formatted = posts.map(p => formatMongoPost(p, req.user.id));
      return res.json(formatted);
    } else {
      await db.read();
      const posts = db.data.posts
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(p => enrichLowdbPost(p, db.data.users, req.user.id));
      return res.json(posts);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get single post
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (isMongoActive()) {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ error: 'Post not found' });
      }
      const post = await Post.findById(req.params.id)
        .populate('author', 'username name avatar')
        .populate('comments.author', 'username name avatar');

      if (!post) return res.status(404).json({ error: 'Post not found' });
      return res.json(formatMongoPost(post, req.user.id));
    } else {
      await db.read();
      const post = db.data.posts.find(p => p.id === req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      return res.json(enrichLowdbPost(post, db.data.users, req.user.id));
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Create post
router.post('/', authenticate, async (req, res) => {
  try {
    const { content, image } = req.body;
    if (!content || !content.trim())
      return res.status(400).json({ error: 'Content is required' });

    if (isMongoActive()) {
      const newPost = new Post({
        author: req.user.id,
        content: content.trim(),
        image: image || null,
        likes: [],
        comments: [],
      });
      await newPost.save();
      const populated = await Post.findById(newPost._id).populate('author', 'username name avatar');
      return res.status(201).json(formatMongoPost(populated, req.user.id));
    } else {
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
      return res.status(201).json(enrichLowdbPost(post, db.data.users, req.user.id));
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete post
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (isMongoActive()) {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      if (post.author.toString() !== req.user.id)
        return res.status(403).json({ error: 'Not your post' });

      await Post.findByIdAndDelete(req.params.id);
      await Notification.deleteMany({ post: req.params.id });
      return res.json({ success: true });
    } else {
      await db.read();
      const idx = db.data.posts.findIndex(p => p.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Post not found' });
      if (db.data.posts[idx].authorId !== req.user.id)
        return res.status(403).json({ error: 'Not your post' });

      db.data.posts.splice(idx, 1);
      await db.write();
      return res.json({ success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Like / unlike post
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    if (isMongoActive()) {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });

      const likedIdx = post.likes.findIndex(l => l.toString() === req.user.id);
      let liked = false;

      if (likedIdx === -1) {
        post.likes.push(req.user.id);
        liked = true;

        if (post.author.toString() !== req.user.id) {
          const notif = new Notification({
            user: post.author,
            fromUser: req.user.id,
            type: 'like',
            post: post._id,
          });
          await notif.save();
        }
      } else {
        post.likes.splice(likedIdx, 1);
        liked = false;
      }
      await post.save();
      return res.json({ liked, likesCount: post.likes.length });
    } else {
      await db.read();
      const post = db.data.posts.find(p => p.id === req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });

      const likedIdx = post.likes.indexOf(req.user.id);
      if (likedIdx === -1) {
        post.likes.push(req.user.id);
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
      return res.json({ liked: likedIdx === -1, likesCount: post.likes.length });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Add comment
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim())
      return res.status(400).json({ error: 'Comment cannot be empty' });

    if (isMongoActive()) {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });

      const commentData = {
        author: req.user.id,
        content: content.trim(),
      };
      post.comments.push(commentData);
      await post.save();

      const updatedPost = await Post.findById(req.params.id).populate('comments.author', 'username name avatar');
      const newComment = updatedPost.comments[updatedPost.comments.length - 1];

      if (post.author.toString() !== req.user.id) {
        const notif = new Notification({
          user: post.author,
          fromUser: req.user.id,
          type: 'comment',
          post: post._id,
        });
        await notif.save();
      }

      const commentAuthor = newComment.author;
      return res.status(201).json({
        id: newComment._id.toString(),
        authorId: req.user.id,
        author: {
          id: commentAuthor._id.toString(),
          username: commentAuthor.username,
          name: commentAuthor.name,
          avatar: commentAuthor.avatar,
        },
        content: newComment.content,
        createdAt: newComment.createdAt,
      });
    } else {
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
      return res.status(201).json(comment);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete comment
router.delete('/:id/comments/:commentId', authenticate, async (req, res) => {
  try {
    if (isMongoActive()) {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });

      const comment = post.comments.id(req.params.commentId);
      if (!comment) return res.status(404).json({ error: 'Comment not found' });

      if (comment.author.toString() !== req.user.id && post.author.toString() !== req.user.id)
        return res.status(403).json({ error: 'Not authorized' });

      post.comments.pull(req.params.commentId);
      await post.save();
      return res.json({ success: true });
    } else {
      await db.read();
      const post = db.data.posts.find(p => p.id === req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });

      const idx = post.comments.findIndex(c => c.id === req.params.commentId);
      if (idx === -1) return res.status(404).json({ error: 'Comment not found' });

      if (post.comments[idx].authorId !== req.user.id && post.authorId !== req.user.id)
        return res.status(403).json({ error: 'Not authorized' });

      post.comments.splice(idx, 1);
      await db.write();
      return res.json({ success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get user posts
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    if (isMongoActive()) {
      let filterId = req.params.userId;
      if (!mongoose.Types.ObjectId.isValid(filterId)) {
        const targetUser = await User.findOne({ username: filterId.toLowerCase() });
        if (targetUser) filterId = targetUser._id;
        else return res.json([]);
      }

      const posts = await Post.find({ author: filterId })
        .sort({ createdAt: -1 })
        .populate('author', 'username name avatar')
        .populate('comments.author', 'username name avatar');

      const formatted = posts.map(p => formatMongoPost(p, req.user.id));
      return res.json(formatted);
    } else {
      await db.read();
      const posts = db.data.posts
        .filter(p => p.authorId === req.params.userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(p => enrichLowdbPost(p, db.data.users, req.user.id));

      return res.json(posts);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
