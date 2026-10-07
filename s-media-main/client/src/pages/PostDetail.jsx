import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'timeago.js';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { HeartIcon, TrashIcon, SendIcon, ArrowLeftIcon } from '../components/Icons';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/posts/${id}`).then(r => setPost(r.data)).catch(() => navigate('/')).finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    const { data } = await api.post(`/posts/${post.id}/like`);
    setPost(p => ({ ...p, liked: data.liked, likesCount: data.likesCount }));
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    await api.delete(`/posts/${post.id}`);
    navigate('/');
  };

  const handleComment = async () => {
    if (!comment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${post.id}/comments`, { content: comment });
      setPost(p => ({ ...p, comments: [...p.comments, data], commentsCount: p.commentsCount + 1 }));
      setComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    await api.delete(`/posts/${post.id}/comments/${commentId}`);
    setPost(p => ({
      ...p,
      comments: p.comments.filter(c => c.id !== commentId),
      commentsCount: p.commentsCount - 1,
    }));
  };

  if (loading) return <div className="spinner" />;
  if (!post) return null;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ArrowLeftIcon /></button>
        <h1>Post</h1>
      </div>

      {/* Post */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
          <Link to={`/profile/${post.author?.username}`}>
            <div className="avatar-ring">
              <img className="avatar" src={post.author?.avatar} alt={post.author?.name} />
            </div>
          </Link>
          <div>
            <Link to={`/profile/${post.author?.username}`} className="post-author-name">{post.author?.name}</Link>
            <div className="post-author-handle" style={{ marginTop: 2 }}>@{post.author?.username}</div>
          </div>
        </div>

        <p style={{ fontSize: 18, lineHeight: 1.65, marginBottom: 16, whiteSpace: 'pre-wrap' }}>{post.content}</p>
        {post.image && <img className="post-image" src={post.image} alt="Post" />}
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14 }}>
          {new Date(post.createdAt).toLocaleString()}
        </p>

        <div className="divider" />
        <div style={{ display: 'flex', gap: 24, padding: '8px 0', fontSize: 14, color: 'var(--text-2)' }}>
          <span><strong style={{ color: 'var(--text)' }}>{post.likesCount}</strong> Likes</span>
          <span><strong style={{ color: 'var(--text)' }}>{post.commentsCount}</strong> Comments</span>
        </div>
        <div className="divider" />

        <div className="post-actions">
          <button className={`action-btn like ${post.liked ? 'active' : ''}`} onClick={handleLike}>
            <HeartIcon /> {post.liked ? 'Liked' : 'Like'}
          </button>
          {user?.id === post.authorId && (
            <button className="action-btn delete" onClick={handleDelete}>
              <TrashIcon /> Delete post
            </button>
          )}
        </div>
      </div>

      {/* Comment composer */}
      <div className="comments-section">
        <div className="comment-composer">
          <img className="avatar avatar-sm" src={user?.avatar} alt={user?.name} style={{ borderRadius: '50%' }} />
          <input
            className="comment-input"
            placeholder="Write a comment…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleComment()}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleComment}
            disabled={!comment.trim() || submitting}
          >
            <SendIcon />
          </button>
        </div>

        {post.comments.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No comments yet. Be the first!</p>
        ) : (
          post.comments.map(c => (
            <div key={c.id} className="comment-item">
              <Link to={`/profile/${c.author?.username}`}>
                <img className="avatar avatar-sm" src={c.author?.avatar} alt={c.author?.name} style={{ borderRadius: '50%' }} />
              </Link>
              <div className="comment-bubble" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="comment-author">
                    <Link to={`/profile/${c.author?.username}`}>{c.author?.name}</Link>
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>@{c.author?.username}</span>
                  <span className="comment-time" style={{ marginLeft: 'auto' }}>{format(c.createdAt)}</span>
                  {(user?.id === c.authorId || user?.id === post.authorId) && (
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '2px 6px', fontSize: 12 }}
                      onClick={() => handleDeleteComment(c.id)}
                    >
                      <TrashIcon size={13} />
                    </button>
                  )}
                </div>
                <p className="comment-text">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
