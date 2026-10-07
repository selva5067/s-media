import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';
import { HeartIcon, CommentIcon, TrashIcon } from './Icons';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function PostCard({ post, onDelete, onLike }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liking, setLiking] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (liking) return;
    setLiking(true);
    try {
      const { data } = await api.post(`/posts/${post.id}/like`);
      onLike?.(post.id, data);
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm('Delete this post?')) return;
    await api.delete(`/posts/${post.id}`);
    onDelete?.(post.id);
  };

  return (
    <article className="post-card" onClick={() => navigate(`/post/${post.id}`)}>
      <div className="post-card-inner">
        <Link to={`/profile/${post.author?.username}`} onClick={e => e.stopPropagation()}>
          <div className="avatar-ring">
            <img className="avatar" src={post.author?.avatar} alt={post.author?.name} />
          </div>
        </Link>
        <div className="post-body">
          <div className="post-author-row">
            <Link
              to={`/profile/${post.author?.username}`}
              className="post-author-name"
              onClick={e => e.stopPropagation()}
            >
              {post.author?.name}
            </Link>
            <span className="post-author-handle">@{post.author?.username}</span>
            <span className="post-time">{format(post.createdAt)}</span>
          </div>

          <p className="post-content">{post.content}</p>
          {post.image && <img className="post-image" src={post.image} alt="Post" />}

          <div className="post-actions">
            <button
              className={`action-btn like ${post.liked ? 'active' : ''}`}
              onClick={handleLike}
              disabled={liking}
            >
              <HeartIcon /> {post.likesCount > 0 && post.likesCount}
            </button>
            <button
              className="action-btn comment"
              onClick={e => { e.stopPropagation(); navigate(`/post/${post.id}`); }}
            >
              <CommentIcon /> {post.commentsCount > 0 && post.commentsCount}
            </button>
            {user?.id === post.authorId && (
              <button className="action-btn delete" onClick={handleDelete}>
                <TrashIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
