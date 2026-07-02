import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { SendIcon } from './Icons';

const MAX = 280;

export default function Composer({ onPost }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const remaining = MAX - text.length;

  const handlePost = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const { data } = await api.post('/posts', { content: text });
      setText('');
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
        <div className="composer-footer">
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
  );
}
