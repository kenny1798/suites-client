//src/pages/AcceptInvite.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@suite/auth';
import { toolsApi } from '@suite/api-clients';
import { useInviteResolve } from '../hooks/useInviteResolve';

export default function AcceptInvite() {
  const { teamId, hash, pos, inviterId } = useParams();
  const { user, ensureLoggedIn } = useAuth(); // pastikan ni ada; kalau tak, just cek user
  const nav = useNavigate();
  const { data, loading, error } = useInviteResolve({ teamId, hash, pos, inviterId });
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState('');

  const doRequest = async () => {
    if (!user) {
      // kalau auth lib ada helper, panggil; else redirect ke login
      if (ensureLoggedIn) return ensureLoggedIn();
      return nav('/login?redirect=' + encodeURIComponent(location.pathname));
    }
    setSubmitting(true);
    setResultMsg('');
    try {
      const url = `/api/salestrack/invite/request/${teamId}/${encodeURIComponent(hash)}`
                + (pos ? `/${encodeURIComponent(pos)}` : '')
                + `/${inviterId}`;
      await toolsApi.post(url, {}, { timeout: 15000 });
      setResultMsg('Request sent. Please wait for approval.');
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to submit request.';
      setResultMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-bold mb-2">Join Team Invitation</h1>

      {loading && <div className="rounded-md border p-4">Resolving invite…</div>}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 p-4">{error}</div>
      )}

      {!loading && !error && data && (
        <div className="rounded-md border bg-white p-5 space-y-4">
          <div>
            <div className="text-slate-500 text-sm">Team</div>
            <div className="text-lg font-semibold">{data.team?.name}</div>
          </div>
          <div>
            <div className="text-slate-500 text-sm">Invited by</div>
            <div className="font-medium">
              {data.inviter?.name} <span className="text-slate-500 text-sm">({data.inviter?.email})</span>
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-sm">Requested role</div>
            <div className="font-medium">{(data.requestedRole || 'SALES_REP').replace('_',' ')}</div>
          </div>

          <div className="pt-2">
            <button
              onClick={doRequest}
              disabled={submitting}
              className="rounded-md bg-slate-900 px-4 py-2 text-white font-semibold disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Request to Join'}
            </button>
            {resultMsg && <p className="mt-3 text-sm text-slate-700">{resultMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
