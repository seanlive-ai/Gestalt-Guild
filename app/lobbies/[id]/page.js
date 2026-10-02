'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import SeatTable from './SeatTable';
import Messages from './Messages';
import Logistics from './Logistics';

function formatWhen(startIso, endIso) {
  const start = new Date(startIso);
  const dateStr = start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const startTime = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (!endIso) return `${dateStr} · ${startTime}`;
  const end = new Date(endIso);
  const endTime = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${dateStr} · ${startTime} – ${endTime}`;
}

export default function LobbyPage({ params }) {
  const lobbyId = params.id;
  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [tab, setTab] = useState('seats');

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData.user?.id || null);

      const { data } = await supabase
        .from('lobbies')
        .select('*, chapters(name), members!lobbies_host_id_fkey(display_name)')
        .eq('id', lobbyId)
        .single();
      setLobby(data);
      setLoading(false);
    })();
  }, [lobbyId]);

  if (loading) return <div className="wrap"><p className="muted">Loading lobby…</p></div>;
  if (!lobby) return <div className="wrap"><p>Lobby not found.</p></div>;

  const isHost = currentUserId && currentUserId === lobby.host_id;

  return (
    <div className="wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
        <h1>{lobby.title}</h1>
        <span className={`status-pill status-${lobby.status}`}>{lobby.status.replace('_', ' ')}</span>
      </div>
      <p className="muted">
        {formatWhen(lobby.datetime_start, lobby.datetime_end)}
        {lobby.location ? ` · ${lobby.location}` : ''}
        {lobby.chapters?.name ? ` · ${lobby.chapters.name}` : ''}
      </p>
      <p className="muted">Hosted by {isHost ? 'you' : (lobby.members?.display_name || 'a guild member')}</p>
      {lobby.address && (isHost || true) && (
        <p className="muted">Address: {lobby.address}</p>
      )}
      <div style={{ marginTop: 6 }}>
        {(lobby.games || []).map((g) => <span key={g} className="tag">{g}</span>)}
      </div>

      <div className="tabs" style={{ marginTop: 22 }}>
        <button className={`tab ${tab === 'seats' ? 'active' : ''}`} onClick={() => setTab('seats')}>Seats</button>
        <button className={`tab ${tab === 'logistics' ? 'active' : ''}`} onClick={() => setTab('logistics')}>Logistics</button>
        <button className={`tab ${tab === 'messages' ? 'active' : ''}`} onClick={() => setTab('messages')}>Messages</button>
      </div>

      {tab === 'seats' && <SeatTable lobby={lobby} currentUserId={currentUserId} />}
      {tab === 'logistics' && <Logistics lobbyId={lobby.id} hostId={lobby.host_id} currentUserId={currentUserId} />}
      {tab === 'messages' && <Messages lobbyId={lobby.id} currentUserId={currentUserId} />}
    </div>
  );
}
