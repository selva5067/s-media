import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'timeago.js';
import api from '../api';

const typeIcon = { like: '❤️', comment: '💬', follow: '👤' };
const typeText = (n) => {
  if (n.type === 'like') return <><strong>{n.from?.name}</strong> liked your post</>;
  if (n.type === 'comment') return <><strong>{n.from?.name}</strong> commented on your post</>;
  if (n.type === 'follow') return <><strong>{n.from?.name}</strong> started following you</>;
  return 'New notification';
};

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/notifications').then(r => setNotifs(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Notifications</h1>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : notifs.length === 0 ? (
        <div className="empty-state">
          <h3>All caught up!</h3>
          <p>Notifications from likes, comments, and follows will appear here.</p>
        </div>
      ) : (
        notifs.map(n => (
          <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
            <Link to={`/profile/${n.from?.username}`}>
              <img className="avatar avatar-sm" src={n.from?.avatar} alt="" style={{ borderRadius: '50%' }} />
            </Link>
            <div style={{ flex: 1 }}>
              <div className="notif-text">{typeText(n)}</div>
              <div className="notif-time">{format(n.createdAt)}</div>
            </div>
            <span style={{ fontSize: 20 }}>{typeIcon[n.type]}</span>
          </div>
        ))
      )}
    </div>
  );
}
