import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import Home from './pages/Home';
import Explore from './pages/Explore';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Register from './pages/Register';

function Shell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
      <RightPanel />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Shell><Home /></Shell></ProtectedRoute>} />
      <Route path="/explore" element={<ProtectedRoute><Shell><Explore /></Shell></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Shell><Notifications /></Shell></ProtectedRoute>} />
      <Route path="/profile/:username" element={<ProtectedRoute><Shell><Profile /></Shell></ProtectedRoute>} />
      <Route path="/post/:id" element={<ProtectedRoute><Shell><PostDetail /></Shell></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
