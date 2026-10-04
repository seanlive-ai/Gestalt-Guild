'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function HousePage() {
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setUserId(userData.user.id);
        const { data: member } = await supabase
          .from('members')
          .select('is_admin')
          .eq('id', userData.user.id)
          .single();
        setIsAdmin(member?.is_admin || false);
      }
    })();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  async function loadEvents() {
    setLoading(true);
    const now = new Date();
    const sixMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());

    const [lobbies, reservations] = await Promise.all([
      supabase
        .from('lobbies')
        .select('id, title, datetime_start, datetime_end, at_community_house')
        .eq('at_community_house', true)
        .gte('datetime_start', now.toISOString())
        .lte('datetime_start', sixMonthsFromNow.toISOString())
        .eq('status', 'open')
        .or('status.eq.full,status.eq.in_progress,status.eq.completed'),

      supabase
        .from('space_reservations')
        .select('id, start_time, end_time, status')
        .eq('status', 'approved')
        .gte('start_time', now.toISOString())
        .lte('start_time', sixMonthsFromNow.toISOString()),
    ]);

    const eventList = [];

    if (lobbies.data) {
      lobbies.data.forEach(lobby => {
        eventList.push({
          id: lobby.id,
          type: 'lobby',
          title: lobby.title,
          startDate: new Date(lobby.datetime_start),
          endDate: lobby.datetime_end ? new Date(lobby.datetime_end) : null,
          startIso: lobby.datetime_start,
          endIso: lobby.datetime_end,
        });
      });
    }

    if (reservations.data) {
      reservations.data.forEach((res, idx) => {
        eventList.push({
          id: `res-${res.id}`,
          type: 'reservation',
          title: 'House Reserved',
          startDate: new Date(res.start_time),
          endDate: new Date(res.end_time),
          startIso: res.start_time,
          endIso: res.end_time,
        });
      });
    }

    setEvents(eventList);
    setLoading(false);
  }

  function getEventsForDate(date) {
    return events.filter(e => {
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return e.startDate <= d && (e.endDate ? e.endDate >= d : e.startDate.toDateString() === d.toDateString());
    });
  }

  function getEventsForWeek(startDate) {
    const weekEnd = new Date(startDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return events.filter(e => {
      return e.startDate <= weekEnd && (e.endDate ? e.endDate >= startDate : e.startDate <= weekEnd);
    }).sort((a, b) => a.startDate - b.startDate);
  }

  const monthDays = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays = Array(firstDay).fill(null).concat(Array.from({ length: monthDays }, (_, i) => new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1)));

  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEvents = getEventsForWeek(weekStart);

  return (
    <div className="wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1>Community House</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {userId && (
            <Link href="/house/request" className="btn btn-sm btn-brass">
              📋 Request booking
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/requests" className="btn btn-sm btn-primary">
              👑 Pending requests
            </Link>
          )}
          <button className={`btn btn-sm ${view === 'month' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('month')}>Month</button>
          <button className={`btn btn-sm ${view === 'week' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('week')}>Week</button>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading calendar…</p>
      ) : view === 'month' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button className="btn btn-sm btn-outline" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>← Prev</button>
            <h2 style={{ margin: 0 }}>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
            <button className="btn btn-sm btn-outline" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>Next →</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, border: '1px solid var(--brass)', borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ padding: 12, backgroundColor: 'var(--felt)', color: 'var(--parchment)', fontWeight: 'bold', textAlign: 'center', fontSize: '0.9rem' }}>
                {day}
              </div>
            ))}
            {calendarDays.map((date, idx) => {
              const dayEvents = date ? getEventsForDate(date) : [];
              return (
                <div
                  key={idx}
                  style={{
                    padding: 8,
                    minHeight: 100,
                    backgroundColor: date ? 'var(--parchment)' : '#f5f5f5',
                    borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid var(--brass)',
                    borderBottom: '1px solid var(--brass)',
                    fontSize: '0.85rem',
                  }}
                >
                  {date && (
                    <>
                      <div style={{ fontWeight: 'bold', marginBottom: 4, color: 'var(--ink)' }}>
                        {date.getDate()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            style={{
                              padding: 4,
                              borderRadius: 3,
                              backgroundColor: event.type === 'lobby' ? 'var(--brass)' : '#e8d5b7',
                              color: 'white',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                            }}
                            title={event.title}
                          >
                            {event.type === 'lobby' ? '🎮' : '🏠'} {event.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button className="btn btn-sm btn-outline" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7))}>← Prev week</button>
            <h2 style={{ margin: 0 }}>
              {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </h2>
            <button className="btn btn-sm btn-outline" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7))}>Next week →</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {weekEvents.length === 0 ? (
              <p className="muted">No bookings this week.</p>
            ) : (
              weekEvents.map(event => (
                <div key={event.id} className="card">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      padding: 12,
                      borderRadius: 4,
                      backgroundColor: event.type === 'lobby' ? 'var(--brass)' : '#e8d5b7',
                      color: 'white',
                      fontSize: '1.5rem',
                      minWidth: 50,
                      textAlign: 'center',
                    }}>
                      {event.type === 'lobby' ? '🎮' : '🏠'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 4px 0' }}>{event.title}</h3>
                      <p className="muted" style={{ margin: 0 }}>
                        {event.startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} {formatTime(event.startIso)}
                        {event.endDate && event.endDate.toDateString() !== event.startDate.toDateString() && (
                          <> – {event.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {formatTime(event.endIso)}</>
                        )}
                        {event.endDate && event.endDate.toDateString() === event.startDate.toDateString() && event.endIso && (
                          <> – {formatTime(event.endIso)}</>
                        )}
                      </p>
                      {event.type === 'lobby' && (
                        <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>Game event at the house</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
