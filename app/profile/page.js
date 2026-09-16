'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const STATUSES = ['own', 'want_to_play', 'wishlist'];

export default function ProfilePage() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState('');
  const [locationZone, setLocationZone] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [bggUsername, setBggUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [library, setLibrary] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newRanking, setNewRanking] = useState('');
  const [newStatus, setNewStatus] = useState('own');
  const [newWillingToHost, setNewWillingToHost] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id || null;
      setUserId(uid);
      if (!uid) { setLoading(false); return; }

      const { data: member } = await supabase.from('members').select('*').eq('id', uid).maybeSingle();
      if (member) {
        setDisplayName(member.display_name || '');
        setLocationZone(member.location_zone || '');
        setTagline(member.tagline || '');
        setBio(member.bio || '');
        setBggUsername(member.bgg_username || '');
      }
      await loadLibrary(uid);
      setLoading(false);
    })();
  }, []);

  async function loadLibrary(uid) {
    const { data } = await supabase.from('game_library').select('*').eq('member_id', uid).order('created_at', { ascending: true });
    setLibrary(data || []);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    const { error } = await supabase.from('members').upsert({
      id: userId,
      display_name: displayName.trim() || 'Guild member',
      location_zone: locationZone || null,
      tagline: tagline || null,
      bio: bio || null,
      bgg_username: bggUsername || null,
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setSaved(true);
  }

  async function addLibraryEntry(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const { error } = await supabase.from('game_library').insert({
      member_id: userId,
      title: newTitle.trim(),
      personal_ranking: newRanking ? Number(newRanking) : null,
      status: newStatus,
      willing_to_host: newWillingToHost,
    });
    if (error) { setError(error.message); return; }
    setNewTitle(''); setNewRanking(''); setNewStatus('own'); setNewWillingToHost(false);
    loadLibrary(userId);
  }

  async function removeLibraryEntry(id) {
    await supabase.from('game_library').delete().eq('id', id);
    loadLibrary(userId);
  }

  if (loading) return <div className="wrap"><p className="muted">Loading…</p></div>;
  if (!userId) return <div className="wrap"><h1>Profile</h1><p className="muted">Log in to view your profile.</p></div>;

  return (
    <div className="wrap" style={{ maxWidth: 560 }}>
      <h1>Your profile</h1>
      <form onSubmit={saveProfile}>
        <div className="field">
          <label htmlFor="displayName">Display name</label>
          <input id="displayName" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="locationZone">Neighborhood / zone</label>
          <input id="locationZone" value={locationZone} onChange={(e) => setLocationZone(e.target.value)} placeholder="NE Portland" />
        </div>
        <div className="field">
          <label htmlFor="tagline">Tagline</label>
          <input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Heavy Euro enjoyer" />
        </div>
        <div className="field">
          <label htmlFor="bio">Bio</label>
          <textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="bgg">BoardGameGeek username</label>
          <input id="bgg" value={bggUsername} onChange={(e) => setBggUsername(e.target.value)} placeholder="Manual entry for now" />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
        {saved && <span className="muted" style={{ marginLeft: 10 }}>Saved.</span>}
      </form>

      <h3 className="section-title">Game library</h3>
      {library.length === 0 && <p className="muted">No games added yet.</p>}
      {library.map((g) => (
        <div key={g.id} className="item-row">
          <span>
            <strong>{g.title}</strong>
            {' '}<span className="tag">{g.status.replace('_', ' ')}</span>
            {g.personal_ranking ? <span className="muted"> · {g.personal_ranking}/10</span> : ''}
            {g.willing_to_host ? <span className="muted"> · will host</span> : ''}
          </span>
          <button className="btn btn-sm btn-quiet" onClick={() => removeLibraryEntry(g.id)}>Remove</button>
        </div>
      ))}
      <form onSubmit={addLibraryEntry} style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <input style={{ flex: 2 }} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Game title" />
        <select style={{ flex: 1 }} value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <input style={{ width: 70 }} type="number" min="1" max="10" value={newRanking} onChange={(e) => setNewRanking(e.target.value)} placeholder="1-10" />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
          <input type="checkbox" checked={newWillingToHost} onChange={(e) => setNewWillingToHost(e.target.checked)} />
          Will host
        </label>
        <button className="btn btn-brass btn-sm" type="submit">Add</button>
      </form>
      <p className="muted" style={{ marginTop: 10 }}>BGG import isn't built yet — add games manually for now.</p>
    </div>
  );
}
