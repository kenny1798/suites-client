import React, { useEffect, useState } from 'react';
import { toolsApi } from '@suite/api-clients';

export default function JoinRequestsPanel({ teamId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const res = await toolsApi.get(`/api/salestrack/teams/${teamId}/join-requests`, { timeout: 15000 });
      setRows(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (teamId) load(); }, [teamId]);

  const act = async (id, action) => {
    try {
      await toolsApi.post(`/api/salestrack/teams/${teamId}/join-requests/${id}/${action}`);
      setRows(r => r.filter(x => x.id !== id)); // optimistic
    } catch (e) {
      alert(e?.response?.data?.error || `Failed to ${action}.`);
    }
  };

  return (
    <section className="bg-white rounded-md border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Pending Join Requests</h2>
        <button onClick={load} className="text-sm text-slate-600 underline">Refresh</button>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      {!loading && !err && rows.length === 0 && (
        <p className="text-sm text-slate-500">No pending requests.</p>
      )}

      {!loading && !err && rows.length > 0 && (
        <div className="divide-y">
          {rows.map(r => (
            <div key={r.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{r?.Requester?.name} <span className="text-slate-500">({r?.Requester?.email})</span></div>
                <div className="text-xs text-slate-500">
                  Invited by {r?.Inviter?.name || '—'} • Role: {r?.requestedRole?.replace('_',' ')}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => act(r.id, 'approve')} className="px-3 py-1 rounded-md bg-emerald-600 text-white text-sm">Approve</button>
                <button onClick={() => act(r.id, 'reject')} className="px-3 py-1 rounded-md bg-red-600 text-white text-sm">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
