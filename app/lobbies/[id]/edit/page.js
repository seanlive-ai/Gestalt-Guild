'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';

export default function EditLobbyPage({ params }) {
  const lobbyId = params.id;
  const router = useRouter();
  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [title, setTitle] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [maxSeats, setMaxSeats] = useState(4);
  const [games, setGames] = useState('');

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData.user?.id || null);

      const { data } = await supabase
        .from('lobbies')
        .select('*')
        .eq('id', lobbyId)
        .single();

      if (data) {
        setLobby(data);
        setTitle(data.title || '');
        setLocation(data.location || '');
        setAddress(data.address || '');
        setMaxSeats(data.max_seats || 4);
        setGames((data.games || []).join(', '));

        const start = new Date(data.datetime_start);
        setDateStart(start.toISOString().split('T')[0]);
        setTimeStart(start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));

        if (data.datetime_end) {
          const end = new Date(data.datetime_end);
          setTimeEnd(end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
        }
      }
      setLoading(false);
    })();
  }, [lobbyId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!lobby || currentUserId !== lobby.host_id) return;

    setSaving(true);
    setError(null);

    const startDateTime = new Date(`${dateStart}T${timeStart}`).toISOString();
    const endDateTime = timeEnd ? new Date(`${dateStart}T${timeEnd}`).toISOString() : null;

    const { error: err } = await supabase
      .from('lobbies')
      .update({
        title: title.trim() || 'Untitled',
        location: location || null,
        address: address || null,
        datetime_start: startDateTime,
        datetime_end: endDateTime,
        max_seats: Math.max(1, parseInt(maxSeats) || 4),
        games: games.split(',').map(g => g.trim()).filter(Boolean),
      })
      .eq('id', lobbyId);

    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      router.push(`/lobbies/${lobbyId}`);
    }
  }

  if (loading) return <div className="wrap"><p className="muted">Loading…</p></div>;
  if (!lobby) return <div className="wrap"><p>Lobby not found.</p></div>;
  if (currentUserId !== lobby.host_id) return <div className="wrap"><p>Only the host can edit this lobby.</p></div>;

  return (
    <div className="wrap" style={{ maxWidth: 560 }}>
      <h1>Edit lobby</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Game name"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div className="field">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="timeStart">Start time</label>
            <input
              id="timeStart"
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="timeEnd">End time</label>
            <input
              id="timeEnd"
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="location">Location / Venue name</label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Sean's place, The Gamer's Den, etc."
          />
        </div>

        <div className="field">
          <label htmlFor="address">Address</label>
          <input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address for maps"
          />
        </div>

        <div className="field">
          <label htmlFor="maxSeats">Max seats</label>
          <input
            id="maxSeats"
            type="number"
            min="1"
            value={maxSeats}
            onChange={(e) => setMaxSeats(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="games">Games (comma-separated)</label>
          <input
            id="games"
            value={games}
            onChange={(e) => setGames(e.target.value)}
            placeholder="Catan, Carcassonne, Ticket to Ride"
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
