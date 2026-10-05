'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getPurposeLabel(purpose) {
  const labels = {
    game_night: '🎲 Game Night',
    coworking: '💼 Coworking',
    hangout: '👥 Hangout',
    private_event: '🎉 Private Event',
    other: '📌 Other',
  };
  return labels[purpose] || purpose;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState({});
  const [creatingLobby, setCreatingLobby] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }
      setUserId(userData.user.id);

      const { data } = await supabase
        .from('space_reservations')
        .select('*')
        .eq('requested_by', userData.user.id)
        .order('start_time', { ascending: false });

      setBookings(data || []);
      setLoading(false);
    })();
  }, [router]);

  async function handleCancelBooking(bookingId) {
    setCanceling(prev => ({ ...prev, [bookingId]: true }));
    const { error } = await supabase
      .from('space_reservations')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (!error) {
      setBookings(bookings.filter(b => b.id !== bookingId));
    }
    setCanceling(prev => ({ ...prev, [bookingId]: false }));
  }

  function handleCreateLobby(booking) {
    const params = new URLSearchParams({
      dateStart: new Date(booking.start_time).toISOString().split('T')[0],
      timeStart: new Date(booking.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      dateEnd: new Date(booking.end_time).toISOString().split('T')[0],
      timeEnd: new Date(booking.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    });
    router.push(`/lobbies/new?${params}`);
  }

  if (loading) return <div className="wrap"><p className="muted">Loading bookings…</p></div>;

  return (
    <div className="wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1>My Bookings</h1>
        <Link href="/house/request" className="btn btn-sm btn-brass">
          📋 New booking
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="card" style={{ marginTop: 20 }}>
          <p className="muted">You haven't made any booking requests yet.</p>
          <Link href="/house/request" className="btn btn-primary" style={{ marginTop: 16 }}>
            📋 Request a booking
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {bookings.map(booking => (
            <div key={booking.id} className="card" style={{ borderLeft: `4px solid ${booking.status === 'approved' ? '#2C6650' : booking.status === 'declined' ? '#8C3B2E' : '#B8935A'}` }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{getPurposeLabel(booking.purpose)}</h3>
                  <span className={`status-pill status-${booking.status}`}>
                    {booking.status === 'approved' ? '✓ Approved' : booking.status === 'pending' ? '⏳ Pending' : booking.status === 'declined' ? '✕ Declined' : booking.status}
                  </span>
                </div>
              </div>

              <div style={{ color: 'var(--ink-soft)', fontSize: '0.95rem', marginBottom: 10 }}>
                <p style={{ margin: '0 0 4px 0' }}>
                  📅 {formatDate(booking.start_time)} · {formatTime(booking.start_time)} – {formatDate(booking.end_time)} · {formatTime(booking.end_time)}
                </p>
                {booking.notes && (
                  <p style={{ margin: '4px 0', fontStyle: 'italic', color: 'var(--ink)' }}>
                    "{booking.notes}"
                  </p>
                )}
                <p style={{ margin: '4px 0' }}>
                  Requested {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {booking.status === 'approved' && (
                <div style={{ paddingTop: 10, borderTop: '1px solid var(--parchment-dark)' }}>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--brass)', marginBottom: 12 }}>
                    ✓ Your booking has been approved! The house will be available for your event.
                  </p>
                  <button
                    onClick={() => handleCreateLobby(booking)}
                    className="btn btn-sm btn-primary"
                    disabled={creatingLobby === booking.id}
                  >
                    {creatingLobby === booking.id ? 'Creating…' : '🎲 Create Lobby from this booking'}
                  </button>
                </div>
              )}

              {booking.status === 'pending' && (
                <div style={{ paddingTop: 10, borderTop: '1px solid var(--parchment-dark)' }}>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--brass)', marginBottom: 12 }}>
                    ⏳ Waiting for admin approval. You'll see the booking on the calendar once approved.
                  </p>
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    className="btn btn-sm btn-outline"
                    disabled={canceling[booking.id]}
                  >
                    {canceling[booking.id] ? 'Canceling…' : '✕ Cancel booking'}
                  </button>
                </div>
              )}

              {booking.status === 'declined' && (
                <div style={{ paddingTop: 10, borderTop: '1px solid var(--parchment-dark)' }}>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--danger)' }}>
                    ✕ Your booking request was declined. You can submit a new request for a different date.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 32, padding: 20, backgroundColor: 'var(--parchment)', borderRadius: 6, borderLeft: '4px solid var(--brass)' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '0.95rem' }}>💡 About Bookings vs. Lobbies</h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
          A <strong>booking</strong> reserves the house for your event. Once approved, it shows on the Community House calendar as "House Reserved." You can then create a <strong>lobby</strong> (game event) to organize seats, players, and game details for your booked time. A booking is just the space reservation—a lobby is the game event.
        </p>
      </div>
    </div>
  );
}
