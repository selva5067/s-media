import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.username || !form.email || !form.password)
      return setError('All fields are required');
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">Pulse</div>
        <p className="auth-tagline">Join the conversation.</p>

        <h2 className="auth-title">Create your account</h2>

        {['name','username','email'].map(field => (
          <div className="form-group" key={field}>
            <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
            <input
              className="form-input"
              type={field === 'email' ? 'email' : 'text'}
              placeholder={field === 'name' ? 'Your full name' : field === 'username' ? 'yourhandle' : 'you@example.com'}
              value={form[field]}
              onChange={e => set(field, e.target.value)}
            />
          </div>
        ))}

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          className="btn btn-primary form-submit"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-3)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
