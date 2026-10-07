import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { HomeIcon, ExploreIcon, BellIcon, UserIcon, LogoutIcon } from './Icons';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const load = () => api.get('/users/notifications/count').then(r => setNotifCount(r.data.count)).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="sidebar">
      <div className="brand">Pulse</div>

      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
        <HomeIcon /> <span>Home</span>
      </NavLink>

      <NavLink to="/explore" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ExploreIcon /> <span>Explore</span>
      </NavLink>

      <NavLink
        to="/notifications"
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        onClick={() => setNotifCount(0)}
      >
        <BellIcon />
        <span>Notifications</span>
        {notifCount > 0 && <span className="nav-badge">{notifCount}</span>}
      </NavLink>

      <NavLink to={`/profile/${user?.username}`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <UserIcon /> <span>Profile</span>
      </NavLink>

      <button
        className="btn-new-post btn"
        onClick={() => navigate('/')}
      >+ Post</button>

      <div className="sidebar-user">
        <img className="avatar avatar-sm" src={user?.avatar} alt={user?.name} />
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-handle">@{user?.username}</div>
        </div>
        <button className="btn btn-ghost" onClick={handleLogout} title="Log out">
          <LogoutIcon />
        </button>
      </div>
    </nav>
  );
}
