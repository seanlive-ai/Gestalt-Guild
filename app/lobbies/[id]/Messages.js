'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function Messages({ lobbyId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*, members(display_name)')
      .eq('scope', 'lobby')
      .eq('lobby_id', lobbyId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoading(false);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim() || !currentUserId) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      scope: 'lobby',
      lobby_id: lobbyId,
      author_id: currentUserId,
      body: body.trim(),
    });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBody('');
    load();
  }

  return (
    <div>
      {loading && <p className="muted">Loading messages…</p>}
      {!loading && messages.length === 0 && <p className="muted">No messages yet. Say hello.</p>}
      <div className="msg-list">
        {messages.map((m) => (
          <div key={m.id} className="msg-bubble">
            <div className="msg-author">
              {m.members?.display_name || 'Guild member'}
              <span className="msg-time">{new Date(m.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
            </div>
            <div className="msg-body">{m.body}</div>
          </div>
        ))}
      </div>
      {currentUserId ? (
        <form onSubmit={handleSend} className="msg-compose">
          <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message…" />
          <button className="btn btn-primary" type="submit" disabled={sending || !body.trim()}>Send</button>
        </form>
      ) : (
        <p className="muted">Log in to join the conversation.</p>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
