'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

function formatWhen(startIso, endIso) {
  const start = new Date(startIso);
  const dateStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${dateStr} · ${timeStr}`;
}

export default function HomePage() {
  const [lobbies, setLobbies] = useState([]);
  const [seatCounts, setSeatCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: lobbyRows } = await supabase
      .from('lobbies')
      .select('id, title, datetime_start, location, games, max_seats, status, chapters(name)')
      .order('datetime_start', { ascending: true });

    setLobbies(lobbyRows || []);

    if (lobbyRows && lobbyRows.length) {
      const { data: bookingRows } = await supabase
        .from('bookings')
        .select('lobby_id, rsvp_status')
        .in('lobby_id', lobbyRows.map((l) => l.id))
        .eq('rsvp_status', 'confirmed');

      const counts = {};
      (bookingRows || []).forEach((b) => {
        counts[b.lobby_id] = (counts[b.lobby_id] || 0) + 1;
      });
      setSeatCounts(counts);
    }
    setLoading(false);
  }

  return (
    <div className="wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
        <h1>Upcoming lobbies</h1>
        <Link href="/lobbies/new" className="btn btn-brass">+ Host a game</Link>
      </div>

      {loading && <p className="muted">Loading lobbies…</p>}
      {!loading && lobbies.length === 0 && (
        <div className="card">
          <p className="muted">No lobbies yet. Be the first to host a game night.</p>
        </div>
      )}

      {lobbies.map((lobby) => {
        const seated = Math.min(seatCounts[lobby.id] || 0, lobby.max_seats);
        return (
          <Link key={lobby.id} href={`/lobbies/${lobby.id}`} className="lobby-card">
            <div className="lobby-card-top">
              <span className="lobby-title">{lobby.title}</span>
              <span className={`status-pill status-${lobby.status}`}>{lobby.status.replace('_', ' ')}</span>
            </div>
            <div className="lobby-meta">
              {formatWhen(lobby.datetime_start)} · {lobby.location || 'Location TBD'} · {seated}/{lobby.max_seats} seats
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
