'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminRequestsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});
  const [memberNames, setMemberNames] = useState({});

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }

      setUserId(userData.user.id);

      const { data: member } = await supabase
        .from('members')
        .select('is_admin')
        .eq('id', userData.user.id)
        .single();

      if (!member?.is_admin) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      loadRequests();
    })();
  }, [router]);

  async function loadRequests() {
    const { data: pendingRequests } = await supabase
      .from('space_reservations')
      .select('id, requested_by, start_time, end_time, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setRequests(pendingRequests || []);

    if (pendingRequests && pendingRequests.length > 0) {
      const requesterIds = [...new Set(pendingRequests.map(r => r.requested_by))];
      const { data: members } = await supabase
        .from('members')
        .select('id, display_name')
        .in('id', requesterIds);

      const nameMap = {};
      members?.forEach(m => {
        nameMap[m.id] = m.display_name || 'Member';
      });
      setMemberNames(nameMap);
    }

    setLoading(false);
  }

  async function handleApprove(requestId) {
    setApproving(prev => ({ ...prev, [requestId]: 'approving' }));
    const { error } = await supabase
      .from('space_reservations')
      .update({ status: 'approved' })
      .eq('id', requestId);

    if (!error) {
      setRequests(requests.filter(r => r.id !== requestId));
    }
    setApproving(prev => ({ ...prev, [requestId]: null }));
  }

  async function handleDeny(requestId) {
    setApproving(prev => ({ ...prev, [requestId]: 'denying' }));
    const { error } = await supabase
      .from('space_reservations')
      .update({ status: 'declined' })
      .eq('id', requestId);

    if (!error) {
      setRequests(requests.filter(r => r.id !== requestId));
    }
    setApproving(prev => ({ ...prev, [requestId]: null }));
  }

  if (loading) return <div className="wrap"><p className="muted">Loading…</p></div>;
  if (!isAdmin) return <div className="wrap"><p>Access denied.</p></div>;

  return (
    <div className="wrap">
      <h1>👑 House booking requests</h1>

      {requests.length === 0 ? (
        <div className="card" style={{ marginTop: 20 }}>
          <p className="muted">No pending requests.</p>
        </div>
      ) : (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(request => (
            <div key={request.id} className="card" style={{ borderLeft: '4px solid var(--brass)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>
                    {memberNames[request.requested_by] || 'Unknown member'}
                  </h3>
                  <p className="muted" style={{ margin: '0 0 8px 0' }}>
                    {formatDate(request.start_time)} – {formatDate(request.end_time)}
                  </p>
                  <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                    Requested {new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleApprove(request.id)}
                    disabled={!!approving[request.id]}
                  >
                    {approving[request.id] === 'approving' ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleDeny(request.id)}
                    disabled={!!approving[request.id]}
                  >
                    {approving[request.id] === 'denying' ? 'Denying…' : 'Deny'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
