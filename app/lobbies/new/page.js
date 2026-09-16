'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function NewLobbyPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [chapterId, setChapterId] = useState(null);

  const [title, setTitle] = useState('');
  const [gamesText, setGamesText] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [maxSeats, setMaxSeats] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
      setCheckingAuth(false);

      const { data: chapters } = await supabase.from('chapters').select('id').limit(1);
      if (chapters && chapters[0]) setChapterId(chapters[0].id);
    })();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    setError(null);

    const startIso = dateStart && timeStart ? new Date(`${dateStart}T${timeStart}`).toISOString() : null;
    const endIso = dateEnd && timeEnd ? new Date(`${dateEnd}T${timeEnd}`).toISOString() : null;

    if (!startIso) {
      setError('Please set a start date and time.');
      setSubmitting(false);
      return;
    }

    const games = gamesText
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);

    const { data, error } = await supabase
      .from('lobbies')
      .insert({
        chapter_id: chapterId,
        host_id: userId,
        title,
        datetime_start: startIso,
        datetime_end: endIso,
        location,
        address,
        games,
        max_seats: Number(maxSeats) || 4,
        status: 'open',
      })
      .select('id')
      .single();

    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    router.push(`/lobbies/${data.id}`);
  }

  if (checkingAuth) return <div className="wrap"><p className="muted">Loading…</p></div>;

  if (!userId) {
    return (
      <div className="wrap">
        <h1>Host a game</h1>
        <p className="muted">You need to be logged in to host a lobby.</p>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: 560 }}>
      <h1>Host a game</h1>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">Lobby title</label>
          <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Friday night Catan" />
        </div>

        <div className="field">
          <label htmlFor="games">Games (comma-separated)</label>
          <input id="games" value={gamesText} onChange={(e) => setGamesText(e.target.value)} placeholder="Catan, Wingspan" />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="dateStart">Start date</label>
            <input id="dateStart" type="date" required value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="timeStart">Start time</label>
            <input id="timeStart" type="time" required value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="dateEnd">End date (optional)</label>
            <input id="dateEnd" type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="timeEnd">End time (optional)</label>
            <input id="timeEnd" type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="location">Location name</label>
          <input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Sean's place" />
        </div>

        <div className="field">
          <label htmlFor="address">Address (shared with confirmed players)</label>
          <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className="field" style={{ maxWidth: 140 }}>
          <label htmlFor="maxSeats">Seats</label>
          <input id="maxSeats" type="number" min="1" max="20" value={maxSeats} onChange={(e) => setMaxSeats(e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create lobby'}
        </button>
      </form>
    </div>
  );
}
