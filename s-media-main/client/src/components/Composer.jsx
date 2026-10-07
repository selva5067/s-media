import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { SendIcon, ImageIcon, CloseIcon } from './Icons';

const MAX = 280;

export default function Composer({ onPost }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef(null);

  const remaining = MAX - text.length;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(data.url);
    } catch {
      alert('Failed to upload image. Please try an image under 5MB.');
    } finally {
      setUploading(false);
    }
  };

  const handlePost = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const { data } = await api.post('/posts', { content: text, image: imageUrl || null });
      setText('');
      setImageUrl('');
      onPost?.(data);
    } finally {
      setPosting(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost();
  };

  return (
    <div className="composer">
      <div className="avatar-ring">
        <img className="avatar" src={user?.avatar} alt={user?.name} />
      </div>
      <div className="composer-body">
        <textarea
          placeholder="What's on your mind?"
          value={text}
          onChange={e => setText(e.target.value.slice(0, MAX))}
          onKeyDown={handleKey}
        />

        {imageUrl && (
          <div style={{ position: 'relative', marginTop: '8px', marginBottom: '8px', borderRadius: '12px', overflow: 'hidden' }}>
            <img src={imageUrl} alt="Attachment preview" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '12px' }} />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.65)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <CloseIcon size={14} />
            </button>
          </div>
        )}

        <div className="composer-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Attach image"
              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent)' }}
            >
              <ImageIcon size={18} /> {uploading ? 'Uploading...' : 'Photo'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className={`char-count ${remaining < 40 ? 'warn' : ''} ${remaining < 10 ? 'danger' : ''}`}>
              {remaining < 60 && `${remaining} left`}
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={handlePost}
              disabled={!text.trim() || posting || text.length > MAX}
            >
              <SendIcon /> {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
