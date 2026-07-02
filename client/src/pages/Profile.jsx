import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import api from '../api';
import { EditIcon } from '../components/Icons';

function EditModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ name: user.name, bio: user.bio || '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/auth/me', form);
      onSave(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">Edit Profile</h2>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Bio</label>
          <textarea className="form-input textarea" value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell people about yourself…" />
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { username } = useParams();
  const { user: me, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const isMe = me?.username === username;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/users/${username}`),
      api.get(`/posts/user/${username}`).catch(() => ({ data: [] })),
    ]).then(([u, p]) => {
      setProfile(u.data);
      // We need userId to get posts
      return api.get(`/posts/user/${u.data.id}`).then(r => { setPosts(r.data); });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [username]);

  const handleFollow = async () => {
    const { data } = await api.post(`/users/${profile.id}/follow`);
    setProfile(p => ({ ...p, isFollowing: data.following, followersCount: data.followersCount }));
  };

  const handleDelete = (id) => setPosts(p => p.filter(x => x.id !== id));
  const handleLike = (id, data) => setPosts(p => p.map(x =>
    x.id === id ? { ...x, liked: data.liked, likesCount: data.likesCount } : x
  ));

  const handleSave = (updated) => {
    setProfile(p => ({ ...p, ...updated }));
    updateUser(updated);
    setEditing(false);
  };

  if (loading) return <div className="spinner" />;
  if (!profile) return <div className="empty-state"><h3>User not found</h3></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{profile.name}</h1>
        <p>{posts.length} posts</p>
      </div>

      <div className="profile-header">
        <div className="profile-cover" />
        <div className="profile-actions">
          {isMe ? (
            <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
              <EditIcon /> Edit profile
            </button>
          ) : (
            <button
              className={`btn-follow ${profile.isFollowing ? 'following' : ''}`}
              onClick={handleFollow}
            >
              {profile.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        <div className="profile-avatar-wrap">
          <div className="avatar-ring" style={{ display: 'inline-block' }}>
            <img className="avatar avatar-xl" src={profile.avatar} alt={profile.name} style={{ border: '3px solid var(--bg)' }} />
          </div>
        </div>

        <div style={{ padding: '12px 20px 0' }}>
          <div className="profile-name">{profile.name}</div>
          <div className="profile-handle">@{profile.username}</div>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-stats">
            <span className="stat"><strong>{profile.followingCount}</strong> Following</span>
            <span className="stat"><strong>{profile.followersCount}</strong> Followers</span>
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <h3>No posts yet</h3>
          {isMe && <p>Create your first post from the home feed!</p>}
        </div>
      ) : (
        posts.map(post => (
          <PostCard key={post.id} post={post} onDelete={handleDelete} onLike={handleLike} />
        ))
      )}

      {editing && <EditModal user={profile} onClose={() => setEditing(false)} onSave={handleSave} />}
    </div>
  );
}
