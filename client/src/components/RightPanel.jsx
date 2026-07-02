import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function RightPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [following, setFollowing] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/users/suggested').then(r => setSuggested(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      api.get(`/users/search?q=${encodeURIComponent(query)}`).then(r => setResults(r.data)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleFollow = async (userId) => {
    const { data } = await api.post(`/users/${userId}/follow`);
    setFollowing(f => ({ ...f, [userId]: data.following }));
    setSuggested(s => s.map(u => u.id === userId
      ? { ...u, isFollowing: data.following, followersCount: data.followersCount }
      : u
    ));
  };

  const users = query.trim() ? results : suggested;

  return (
    <aside className="right-panel">
      <div className="panel-section">
        <input
          className="search-box"
          placeholder="🔍  Search people…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        {query.trim() && results.length === 0 && (
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No results for "{query}"</p>
        )}

        {users.map(u => (
          <div key={u.id} className="suggested-user">
            <Link to={`/profile/${u.username}`}>
              <div className="avatar-ring">
                <img className="avatar avatar-sm" src={u.avatar} alt={u.name} />
              </div>
            </Link>
            <div className="suggested-user-info">
              <div className="suggested-user-name">
                <Link to={`/profile/${u.username}`}>{u.name}</Link>
              </div>
              <div className="suggested-user-handle">@{u.username}</div>
            </div>
            <button
              className={`btn-follow ${(following[u.id] ?? u.isFollowing) ? 'following' : ''}`}
              onClick={() => handleFollow(u.id)}
            >
              {(following[u.id] ?? u.isFollowing) ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
