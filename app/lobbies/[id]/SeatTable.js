'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

function seatPosition(index, total) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = 42;
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);
  return { left: `${x}%`, top: `${y}%` };
}

function nameFor(booking, currentUserId) {
  if (!booking) return '';
  if (currentUserId && booking.member_id === currentUserId) return 'You';
  if (booking.guest_name) return booking.guest_name;
  return booking.members?.display_name || 'Guild member';
}

export default function SeatTable({ lobby, currentUserId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [confirmFree, setConfirmFree] = useState(null); // booking pending free confirmation
  const [claimSeatIndex, setClaimSeatIndex] = useState(null); // empty seat index being claimed
  const [claimGuestName, setClaimGuestName] = useState('');

  const [addWaitlistOpen, setAddWaitlistOpen] = useState(false);
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistIsSelf, setWaitlistIsSelf] = useState(false);
  const [waitlistError, setWaitlistError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isHost = currentUserId && lobby.host_id === currentUserId;

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobby.id]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*, members(display_name)')
      .eq('lobby_id', lobby.id)
      .neq('rsvp_status', 'cancelled')
      .order('created_at', { ascending: true });
    if (error) setError(error.message);
    setBookings(data || []);
    setLoading(false);
  }

  const confirmedBySeat = useMemo(() => {
    const map = {};
    bookings
      .filter(
        (b) =>
          b.rsvp_status === 'confirmed' &&
          b.seat_index !== null &&
          b.seat_index >= 0 &&
          b.seat_index < lobby.max_seats
      )
      .forEach((b) => {
        map[b.seat_index] = b;
      });
    return map;
  }, [bookings, lobby.max_seats]);

  // Confirmed bookings that don't map to an actual seat on this table (e.g. seat_index
  // beyond max_seats). These were silently inflating the seated count without ever
  // rendering, so they're surfaced separately instead of being counted or hidden.
  const overflowConfirmed = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.rsvp_status === 'confirmed' &&
          (b.seat_index === null || b.seat_index < 0 || b.seat_index >= lobby.max_seats)
      ),
    [bookings, lobby.max_seats]
  );

  const waitlist = useMemo(
    () => bookings.filter((b) => b.rsvp_status === 'waitlisted'),
    [bookings]
  );

  const mySeatBooking = useMemo(
    () => bookings.find((b) => b.rsvp_status === 'confirmed' && b.member_id === currentUserId),
    [bookings, currentUserId]
  );

  const openSeatIndexes = useMemo(() => {
    const taken = new Set(Object.keys(confirmedBySeat).map(Number));
    const open = [];
    for (let i = 0; i < lobby.max_seats; i++) if (!taken.has(i)) open.push(i);
    return open;
  }, [confirmedBySeat, lobby.max_seats]);

  function closeClaim() {
    setClaimSeatIndex(null);
    setClaimGuestName('');
  }

  function handleSeatClick(index) {
    setError(null);
    const booking = confirmedBySeat[index];
    if (booking) {
      // Taken seat: ask before freeing, never free automatically.
      setConfirmFree(booking);
    } else {
      setClaimSeatIndex(index);
    }
  }

  async function takeSeatSelf(index) {
    if (!currentUserId) return;
    setBusy(true);
    const { error } = await supabase.from('bookings').insert({
      lobby_id: lobby.id,
      seat_index: index,
      member_id: currentUserId,
      rsvp_status: 'confirmed',
      assigned_by_host: false,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    closeClaim();
    load();
  }

  async function assignGuestToSeat(index) {
    if (!claimGuestName.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('bookings').insert({
      lobby_id: lobby.id,
      seat_index: index,
      guest_name: claimGuestName.trim(),
      rsvp_status: 'confirmed',
      assigned_by_host: true,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    closeClaim();
    load();
  }

  const canFree = confirmFree && (isHost || confirmFree.member_id === currentUserId);

  async function freeSeat() {
    if (!confirmFree) return;
    setBusy(true);
    const { error } = await supabase.from('bookings').delete().eq('id', confirmFree.id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setConfirmFree(null);
    load();
  }

  function openAddWaitlist() {
    setWaitlistName('');
    setWaitlistIsSelf(false);
    setWaitlistError(null);
    setAddWaitlistOpen(true);
  }

  async function submitAddToWaitlist() {
    const isSelf = waitlistIsSelf && currentUserId;
    if (!isSelf && !waitlistName.trim()) {
      setWaitlistError('Enter a name, or check "This is me".');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('bookings').insert({
      lobby_id: lobby.id,
      seat_index: null,
      member_id: isSelf ? currentUserId : null,
      guest_name: isSelf ? null : waitlistName.trim(),
      rsvp_status: 'waitlisted',
      assigned_by_host: isHost,
    });
    setBusy(false);
    if (error) {
      setWaitlistError(error.message);
      return;
    }
    setAddWaitlistOpen(false);
    load();
  }

  async function seatFromWaitlist(booking) {
    if (openSeatIndexes.length === 0) return;
    setBusy(true);
    const { error } = await supabase
      .from('bookings')
      .update({ seat_index: openSeatIndexes[0], rsvp_status: 'confirmed' })
      .eq('id', booking.id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  }

  async function removeFromWaitlist(booking) {
    setBusy(true);
    const { error } = await supabase.from('bookings').delete().eq('id', booking.id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  }

  if (loading) return <p className="muted">Loading seats…</p>;

  return (
    <div>
      <div className="table-wrap">
        <div className="felt-table">
          {lobby.title}
          <br />
          {Object.keys(confirmedBySeat).length}/{lobby.max_seats} seated
        </div>
        {Array.from({ length: lobby.max_seats }).map((_, i) => {
          const booking = confirmedBySeat[i];
          const pos = seatPosition(i, lobby.max_seats);
          const mine = booking && booking.member_id === currentUserId;
          return (
            <button
              key={i}
              className={`seat ${booking ? '' : 'empty'} ${mine ? 'mine' : ''}`}
              style={pos}
              onClick={() => handleSeatClick(i)}
              title={booking ? nameFor(booking, currentUserId) : `Seat ${i + 1} — open`}
            >
              {booking ? nameFor(booking, currentUserId) : 'Open'}
            </button>
          );
        })}
      </div>

      {error && <p className="error-text">{error}</p>}

      {overflowConfirmed.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--danger)', marginBottom: 16 }}>
          <p style={{ margin: 0 }}>
            <strong>{overflowConfirmed.length}</strong>{' '}
            {overflowConfirmed.length === 1 ? "guest is" : "guests are"} confirmed but{' '}
            {overflowConfirmed.length === 1 ? "doesn't" : "don't"} have a numbered seat
            (table capacity is {lobby.max_seats}):
          </p>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            {overflowConfirmed.map((b) => (
              <li key={b.id} style={{ marginBottom: 4 }}>
                {nameFor(b, currentUserId)}
                {(isHost || b.member_id === currentUserId) && (
                  <button
                    className="btn btn-quiet btn-sm"
                    style={{ marginLeft: 8 }}
                    disabled={busy}
                    onClick={() => removeFromWaitlist(b)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="waitlist">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Waitlist{waitlist.length ? ` (${waitlist.length})` : ''}</h3>
          <button className="btn btn-outline btn-sm" onClick={openAddWaitlist}>+ Add to waitlist</button>
        </div>
        {waitlist.length === 0 && <p className="muted" style={{ marginTop: 10 }}>No one's waiting.</p>}
        {waitlist.map((b, idx) => (
          <div key={b.id} className="waitlist-row">
            <span><span className="waitlist-rank">{idx + 1}.</span>{nameFor(b, currentUserId)}</span>
            <span style={{ display: 'flex', gap: 8 }}>
              {isHost && openSeatIndexes.length > 0 && (
                <button className="btn btn-brass btn-sm" disabled={busy} onClick={() => seatFromWaitlist(b)}>
                  Seat now
                </button>
              )}
              {(isHost || b.member_id === currentUserId) && (
                <button className="btn btn-quiet btn-sm" disabled={busy} onClick={() => removeFromWaitlist(b)}>
                  Remove
                </button>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Confirm-before-free modal: clicking a taken seat no longer frees it automatically */}
      {confirmFree && (
        <div className="modal-backdrop" onClick={() => setConfirmFree(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Free this seat?</h3>
            <p>{nameFor(confirmFree, currentUserId)} is seated here.</p>
            {canFree ? (
              <p className="muted">Would you like to free this seat?</p>
            ) : (
              <p className="muted">Only the host or the seated player can free this seat.</p>
            )}
            <div className="modal-actions">
              <button className="btn btn-quiet" onClick={() => setConfirmFree(null)}>No, keep it</button>
              {canFree && (
                <button className="btn btn-danger" disabled={busy} onClick={freeSeat}>
                  {busy ? 'Freeing…' : 'Yes, free seat'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Claim-empty-seat modal */}
      {claimSeatIndex !== null && (
        <div className="modal-backdrop" onClick={closeClaim}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Seat {claimSeatIndex + 1}</h3>
            {!currentUserId && <p className="muted">Log in to take a seat.</p>}
            {currentUserId && !mySeatBooking && (
              <button className="btn btn-primary" disabled={busy} onClick={() => takeSeatSelf(claimSeatIndex)}>
                Take this seat
              </button>
            )}
            {currentUserId && mySeatBooking && (
              <p className="muted">You're already seated at this table.</p>
            )}
            {isHost && (
              <div className="field" style={{ marginTop: 14 }}>
                <label htmlFor="guestName">Assign a guest</label>
                <input
                  id="guestName"
                  value={claimGuestName}
                  onChange={(e) => setClaimGuestName(e.target.value)}
                  placeholder="Guest name"
                />
                <button
                  className="btn btn-outline"
                  style={{ marginTop: 8 }}
                  disabled={busy || !claimGuestName.trim()}
                  onClick={() => assignGuestToSeat(claimSeatIndex)}
                >
                  Assign guest
                </button>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-quiet" onClick={closeClaim}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual add-to-waitlist modal: available any time, regardless of open seats */}
      {addWaitlistOpen && (
        <div className="modal-backdrop" onClick={() => setAddWaitlistOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add to waitlist</h3>
            {!waitlistIsSelf && (
              <div className="field">
                <label htmlFor="waitlistName">Name</label>
                <input
                  id="waitlistName"
                  value={waitlistName}
                  onChange={(e) => setWaitlistName(e.target.value)}
                  placeholder="Guest or member name"
                />
              </div>
            )}
            {currentUserId && (
              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="isSelf"
                  checked={waitlistIsSelf}
                  onChange={(e) => setWaitlistIsSelf(e.target.checked)}
                />
                <label htmlFor="isSelf" style={{ margin: 0 }}>This is me</label>
              </div>
            )}
            {waitlistError && <p className="error-text">{waitlistError}</p>}
            <div className="modal-actions">
              <button className="btn btn-quiet" onClick={() => setAddWaitlistOpen(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy} onClick={submitAddToWaitlist}>
                {busy ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
