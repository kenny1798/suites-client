// src/components/team/InviteByLinkPanel.jsx
import React from 'react';
import { toolsApi } from '@suite/api-clients';
import { useAuth } from '@suite/auth';
import { useTeam } from '@suite/core-context';
import { useTeamRole } from '@suite/hooks';

const ROLES = ['ADMIN', 'MANAGER', 'SALES_REP'];

function CopyBtn({ text }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="px-3 py-1 rounded border text-xs"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function InviteByLinkPanel() {
  const { activeTeam } = useTeam();
  const { user } = useAuth();
  const teamId = activeTeam?.id;

  const { role: myRole, canInvite } = useTeamRole(teamId);

  const [managers, setManagers] = React.useState([]);
  const [loadingManagers, setLoadingManagers] = React.useState(false);

  // form state (no email)
  const [role, setRole] = React.useState('SALES_REP');
  const [managerId, setManagerId] = React.useState(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [inviteLink, setInviteLink] = React.useState('');

  // Fetch managers for dropdown
  React.useEffect(() => {
    if (!teamId || !(myRole === 'OWNER' || myRole === 'ADMIN')) return;
    let alive = true;
    (async () => {
      setLoadingManagers(true);
      try {
        const res = await toolsApi.get(`/api/salestrack/teams/${teamId}/members`, { timeout: 15000 });
        const list = (res.data || []).filter(m => m.role === 'MANAGER');
        if (alive) setManagers(list);
      } finally {
        if (alive) setLoadingManagers(false);
      }
    })();
    return () => { alive = false; };
  }, [teamId, myRole]);

  // Manager: lock role & managerId
  React.useEffect(() => {
    if (myRole === 'MANAGER') {
      setRole('SALES_REP');
      setManagerId(user?.id || null);
    }
  }, [myRole, user?.id]);

  if (!teamId) return null;
  if (!canInvite) {
    return (
      <section className="rounded-md border p-6 bg-white">
        <h3 className="text-lg font-semibold">Invite Members</h3>
        <p className="text-sm text-slate-500 mt-1">You don’t have permission to invite members.</p>
      </section>
    );
  }

  const availableRoles = myRole === 'MANAGER' ? ['SALES_REP'] : ROLES;
  const showManagerSelect =
    (myRole === 'OWNER' || myRole === 'ADMIN') && role === 'SALES_REP';

  const createLink = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setInviteLink('');
    try {
      const body = { role };
      if (myRole === 'MANAGER') body.managerId = user?.id;
      if (showManagerSelect && managerId) body.managerId = Number(managerId);

      const res = await toolsApi.post(`/api/salestrack/teams/${teamId}/invitations`, body, { timeout: 20000 });
      setInviteLink(res.data?.invitation?.link || '');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create invitation link.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-md border p-6 bg-white">
      <h3 className="text-lg font-semibold">Invite Members</h3>
      <p className="text-sm text-slate-500 mt-1">
        Generate a one-time link. Recipient registers/logs in, then opens this link to join.
      </p>

      <form onSubmit={createLink} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
          disabled={myRole === 'MANAGER'}
        >
          {availableRoles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>

        {showManagerSelect ? (
          <select
            value={managerId ?? ''}
            onChange={(e) => setManagerId(e.target.value || null)}
            className="w-full rounded-md border px-3 py-2"
            disabled={loadingManagers}
          >
            <option value="">— Assign Manager —</option>
            {managers.map(m => (
              <option key={m.userId} value={m.userId}>
                {m.User?.name || `User #${m.userId}`}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="w-full rounded-md border px-3 py-2 bg-slate-50 text-slate-500"
            readOnly
            value={
              myRole === 'MANAGER'
                ? `Manager: ${user?.name || user?.email}`
                : role === 'SALES_REP' ? 'Optional: assign manager' : '—'
            }
          />
        )}

        <button
          type="submit"
          disabled={submitting}
          className="md:col-span-1 rounded-md bg-slate-900 text-white px-4 py-2 font-semibold disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create Link'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {inviteLink && (
        <div className="mt-4 p-3 rounded border bg-slate-50 flex items-center justify-between gap-3">
          <div className="truncate text-sm">{inviteLink}</div>
          <CopyBtn text={inviteLink} />
        </div>
      )}
    </section>
  );
}
