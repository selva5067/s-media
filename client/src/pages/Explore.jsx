import { useState, useEffect } from 'react';
import PostCard from '../components/PostCard';
import api from '../api';

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/posts/explore').then(r => setPosts(r.data)).finally(() => setLoading(false));
  }, []);

  const handleDelete = (id) => setPosts(p => p.filter(x => x.id !== id));
  const handleLike = (id, data) => setPosts(p => p.map(x =>
    x.id === id ? { ...x, liked: data.liked, likesCount: data.likesCount } : x
  ));

  return (
    <div>
      <div className="page-header">
        <h1>Explore</h1>
        <p>Discover what's happening</p>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <h3>No posts yet</h3>
          <p>Be the first to post something!</p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onDelete={handleDelete}
            onLike={handleLike}
          />
        ))
      )}
    </div>
  );
}
