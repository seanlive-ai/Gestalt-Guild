'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function RequestHousePage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }
      setUserId(userData.user.id);
      setLoading(false);
    })();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId || !startDate || !endDate) return;

    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase.from('space_reservations').insert({
      requested_by: userId,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      approved: false,
    });

    setSubmitting(false);
    if (err) {
      setError(err.message);
    } else {
      setSubmitted(true);
      setTimeout(() => router.push('/house'), 2000);
    }
  }

  if (loading) return <div className="wrap"><p className="muted">Loading…</p></div>;

  return (
    <div className="wrap" style={{ maxWidth: 560 }}>
      <h1>Request house booking</h1>

      {submitted ? (
        <div className="card" style={{ marginTop: 20, backgroundColor: '#e8f5e9', borderLeft: '4px solid #4caf50', padding: 16 }}>
          <p style={{ margin: 0, color: '#2e7d32', fontWeight: 'bold' }}>✓ Request submitted!</p>
          <p className="muted" style={{ margin: '8px 0 0 0' }}>Admin will review and approve soon. Redirecting…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label htmlFor="startDate">Start date</label>
              <input
                id="startDate"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="field">
              <label htmlFor="endDate">End date</label>
              <input
                id="endDate"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="purpose">Purpose (optional)</label>
            <textarea
              id="purpose"
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="E.g., Private game night, Board game tournament, etc."
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </button>
          </div>

          <p className="muted" style={{ marginTop: 20, fontSize: '0.9rem' }}>
            Your booking request will be reviewed by an admin. You'll see it in pending status once submitted.
          </p>
        </form>
      )}
    </div>
  );
}
