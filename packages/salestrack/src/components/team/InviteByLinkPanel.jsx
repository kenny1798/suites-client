import React from 'react';
import { toolsApi } from '@suite/api-clients';
import { useAuth } from '@suite/auth';
import { useTeam } from '@suite/core-context';
import { useTeamRole } from '@suite/hooks';

const TOOL_ID = 'salestrack';
const DEFAULT_ROLES = ['ADMIN', 'MANAGER', 'SALES_REP'];

function CopyBtn({ text }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {/* no-op */}
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

  const entByTool = user?.suiteEntitlements?.entitlements?.[TOOL_ID] || {};
  const features  = entByTool?.features || {};

  // readLimit inline
  const readLimit = (k, dflt) => {
    const f = features?.[k];
    if (!f) return dflt;
    if (f.limit === null || f.limitInt === null || f.limitText === null) return Infinity;
    const raw = (f.limit ?? f.limitInt ?? f.limitText);
    const n = Number(raw);
    return Number.isFinite(n) ? n : dflt;
  };

  // seats from plan or defaults
  const planCode = entByTool?.planCode;
  const planSeatsRaw = entByTool?.plan?.seats;
  const seatsFromPlan =
    planSeatsRaw === null
      ? Infinity
      : (planSeatsRaw === 0 ? Infinity
         : (Number.isFinite(Number(planSeatsRaw)) ? Number(planSeatsRaw) : undefined));
  const PLAN_DEFAULTS = {
    ST_PRO_INDIVIDUAL_MONTHLY: 1,
    ST_PRO_TEAM_MONTHLY: 5,
    ST_ENTERPRISE_MONTHLY: Infinity,
  };
  const seatsFromPlanCode = PLAN_DEFAULTS[planCode];

  const teamLevel       = readLimit('ST_TEAM_LEVEL', 1);
  const managerRepLimit = readLimit('ST_MANAGER_REP_LIMIT', 10);

  const memberLimit = (() => {
    const f = features?.ST_MEMBER_LIMIT;
    if (f?.enabled) {
      if (f.limit === null || f.limitInt === null || f.limitText === null) return Infinity;
      const raw = f.limit ?? f.limitInt ?? f.limitText;
      const n = Number(raw);
      if (Number.isFinite(n)) return n;
    }
    if (seatsFromPlan !== undefined) return seatsFromPlan;
    if (seatsFromPlanCode !== undefined) return seatsFromPlanCode;
    return teamLevel >= 3 ? Infinity : (teamLevel === 2 ? 5 : 1);
  })();

  // role tiers (optional)
  let allowedRoles = DEFAULT_ROLES;
  try {
    const raw = features?.ST_ROLE_TIERS?.limit;
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) {
        allowedRoles = arr.filter((r) => r !== 'OWNER'); // jangan bagi OWNER
      }
    }
  } catch {/* ignore */}

  const [managers, setManagers] = React.useState([]);
  const [loadingManagers, setLoadingManagers] = React.useState(false);

  const [role, setRole] = React.useState('SALES_REP');
  const [managerId, setManagerId] = React.useState(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [inviteLink, setInviteLink] = React.useState('');

  const [memberCount, setMemberCount] = React.useState(0);
  const [myRepsCount, setMyRepsCount] = React.useState(0);

  // fetch current members (for caps + manager list)
  React.useEffect(() => {
    if (!teamId) return;
    let alive = true;
    (async () => {
      setLoadingManagers(true);
      try {
        const res = await toolsApi.get(`/api/salestrack/teams/${teamId}/members`, { timeout: 15000 });
        const list = (res.data || []).map(m => ({ ...m, User: m.User || m.user }));
        if (!alive) return;

        setMemberCount(list.length);
        if (myRole === 'OWNER' || myRole === 'ADMIN') {
          setManagers(list.filter(m => m.role === 'MANAGER'));
        } else {
          setManagers([]);
        }

        if (myRole === 'MANAGER') {
          const myId = user?.id;
          const reps = list.filter(m =>
            m.role === 'SALES_REP' &&
            String(m.managerId || m.ManagerId) === String(myId)
          );
          setMyRepsCount(reps.length);
        } else {
          setMyRepsCount(0);
        }
      } catch {
        // ignore
      } finally {
        if (alive) setLoadingManagers(false);
      }
    })();
    return () => { alive = false; };
  }, [teamId, myRole, user?.id]);

  // manager: lock role & managerId
  React.useEffect(() => {
    if (myRole === 'MANAGER') {
      setRole('SALES_REP');
      setManagerId(user?.id || null);
    }
  }, [myRole, user?.id]);

  if (!teamId) return null;

  const atMemberCap  = Number.isFinite(memberLimit) ? memberCount >= memberLimit : false;
  const atManagerCap = myRole === 'MANAGER'
    ? (Number.isFinite(managerRepLimit) ? myRepsCount >= managerRepLimit : false)
    : false;

  const uiCanInvite = canInvite && !atMemberCap && !atManagerCap;

  if (!canInvite) {
    return (
      <section className="rounded-md border p-6 bg-white">
        <h3 className="text-lg font-semibold">Invite Members</h3>
        <p className="text-sm text-slate-500 mt-1">You don’t have permission to invite members.</p>
      </section>
    );
  }

  const availableRoles = (myRole === 'MANAGER')
    ? ['SALES_REP']
    : allowedRoles.filter(r => DEFAULT_ROLES.includes(r));

  const showManagerSelect =
    (myRole === 'OWNER' || myRole === 'ADMIN') && role === 'SALES_REP';

  const createLink = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setInviteLink('');
    try {
      if (atMemberCap) throw new Error('MEMBER_LIMIT_REACHED');
      if (atManagerCap) throw new Error('MANAGER_REP_LIMIT_REACHED');
      if (showManagerSelect && !managerId) throw new Error('MANAGER_REQUIRED_FOR_REP');

      const body = { role };
      if (myRole === 'MANAGER') body.managerId = user?.id;
      if (showManagerSelect && managerId) body.managerId = Number(managerId);

      const res = await toolsApi.post(`/api/salestrack/teams/${teamId}/invitations`, body, { timeout: 20000 });
      setInviteLink(res.data?.invitation?.link || '');
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        (err?.message === 'MEMBER_LIMIT_REACHED' ? 'Member limit reached for your plan.' :
         err?.message === 'MANAGER_REP_LIMIT_REACHED' ? 'Your rep limit is reached.' :
         err?.message === 'MANAGER_REQUIRED_FOR_REP' ? 'Please select a manager for this member.' :
         'Failed to create invitation link.');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-md border p-6 mb-6 bg-white">
      <h3 className="text-lg font-semibold">Invite Members</h3>
      <p className="text-sm text-slate-500 mt-1">
        Generate a one-time link. Recipient registers/logs in, then opens this link to join.
      </p>

      {(atMemberCap || atManagerCap) && (
        <div className="mt-3 mb-2 rounded border border-amber-200 bg-amber-50 text-amber-800 text-sm p-3">
          {atMemberCap
            ? <>Member limit reached ({memberCount}/{Number.isFinite(memberLimit) ? memberLimit : '∞'}). <a className="underline" href="/store?tool=salestrack">Upgrade plan</a> to add more.</>
            : <>Your rep limit is reached ({myRepsCount}/{Number.isFinite(managerRepLimit) ? managerRepLimit : '∞'}). Contact your admin/owner.</>}
        </div>
      )}

      <form onSubmit={createLink} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
          disabled={myRole === 'MANAGER'}
        >
          {availableRoles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>

        {(myRole === 'OWNER' || myRole === 'ADMIN') ? (
          role === 'SALES_REP' ? (
            <select
              value={managerId ?? ''}
              onChange={(e) => setManagerId(e.target.value || null)}
              className="w-full rounded-md border px3 py-2"
              disabled={loadingManagers}
            >
              <option value="">— Assign Manager —</option>
              {managers.map(m => (
                <option key={m.userId} value={m.userId}>
                  {m.User?.name || m.User?.email || `User #${m.userId}`}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="w-full rounded-md border px-3 py-2 bg-slate-50 text-slate-500"
              readOnly
              value="—"
            />
          )
        ) : (
          <input
            className="w-full rounded-md border px-3 py-2 bg-slate-50 text-slate-500"
            readOnly
            value={myRole === 'MANAGER'
              ? `Manager: ${user?.name || user?.email}`
              : '—'}
          />
        )}

        <button
          type="submit"
          disabled={submitting || !uiCanInvite}
          className="md:col-span-1 rounded-md bg-slate-900 text-white px-4 py-2 font-semibold disabled:opacity-50"
          title={!uiCanInvite ? 'Invite disabled by current plan limits' : undefined}
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
