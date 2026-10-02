'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

function formatWhen(startIso) {
  const start = new Date(startIso);
  const dateStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${dateStr} · ${timeStr}`;
}

export default function LobbyHistoryPage() {
  const [lobbies, setLobbies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: lobbyRows } = await supabase
      .from('lobbies')
      .select('id, title, datetime_start, location, games, max_seats, status, chapters(name)')
      .in('status', ['completed', 'archived', 'cancelled'])
      .order('datetime_start', { ascending: false });

    setLobbies(lobbyRows || []);
    setLoading(false);
  }

  return (
    <div className="wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
        <h1>Past lobbies</h1>
        <Link href="/" className="btn btn-outline">← Back to upcoming</Link>
      </div>

      {loading && <p className="muted">Loading history…</p>}
      {!loading && lobbies.length === 0 && (
        <div className="card">
          <p className="muted">No completed games yet.</p>
        </div>
      )}

      {lobbies.map((lobby) => {
        const statusLabel = lobby.status === 'cancelled' ? 'Cancelled' :
                           lobby.status === 'completed' ? 'Completed' : 'Archived';
        return (
          <Link key={lobby.id} href={`/lobbies/${lobby.id}`} className="lobby-card">
            <div className="lobby-card-top">
              <span className="lobby-title">{lobby.title}</span>
              <span className={`status-pill status-${lobby.status}`}>{statusLabel}</span>
            </div>
            <div className="lobby-meta">
              {formatWhen(lobby.datetime_start)} · {lobby.location || 'Location TBD'}
              {lobby.chapters?.name ? ` · ${lobby.chapters.name}` : ''}
            </div>
            <div style={{ marginTop: 8 }}>
              {(lobby.games || []).map((g) => (
                <span key={g} className="tag">{g}</span>
              ))}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
