import { useState, useEffect } from 'react';
import PostCard from '../components/PostCard';
import Composer from '../components/Composer';
import api from '../api';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/posts/feed');
      setPosts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFeed(); }, []);

  const handlePost = (newPost) => setPosts(p => [newPost, ...p]);
  const handleDelete = (id) => setPosts(p => p.filter(x => x.id !== id));
  const handleLike = (id, data) => setPosts(p => p.map(x =>
    x.id === id ? { ...x, liked: data.liked, likesCount: data.likesCount } : x
  ));

  return (
    <div>
      <div className="page-header">
        <h1>Home</h1>
        <p>Your feed</p>
      </div>

      <Composer onPost={handlePost} />

      {loading ? (
        <div className="spinner" />
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <h3>Nothing here yet</h3>
          <p>Follow people from Explore to see their posts, or create your first post above.</p>
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
