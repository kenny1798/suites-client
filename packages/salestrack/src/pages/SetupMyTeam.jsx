// packages/salestrack/src/pages/SetupMyTeam.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@suite/auth';
import { toolsApi } from '@suite/api-clients';
import { useTeam } from '@suite/core-context';

const TOOL_ID = 'salestrack';

function toCode(x){ return (x ?? '').toString().trim().toLowerCase(); }

export default function SetupMyTeam() {
  const { user, entitlementsFor } = useAuth();
  const navigate = useNavigate();
  const { refreshTeams } = useTeam?.() || {}; // optional: kalau TeamProvider expose refresh

  const st = entitlementsFor?.(TOOL_ID) || null;
  const status = toCode(st?.status);
  const subActive = status === 'active' || status === 'trialing';
  const planCode = st?.planCode;
  const features = st?.features || {};

  // Helper: baca level/limit dari entitlement
  const readLimitNumber = (f, dflt) => {
    if (!f) return dflt;
    if (f.limit === null || f.limitInt === null || f.limitText === null) return Infinity;
    const raw = f.limit ?? f.limitInt ?? f.limitText;
    const n = Number(raw);
    return Number.isFinite(n) ? n : dflt;
  };
  const teamLevel = readLimitNumber(features?.ST_TEAM_LEVEL, 1); // 1=Individual, 2=Team, 3=Enterprise
  const teamLimit = readLimitNumber(features?.ST_TEAM_LIMIT, teamLevel >= 3 ? Infinity : 1);

  const [teamName, setTeamName] = React.useState(`${user?.name?.split(' ')[0] || 'My'} Team`);
  const [teamBasedCountry, setTeamBasedCountry] = React.useState('MY');
  const [teamCurrency, setTeamCurrency] = React.useState('MYR');
  const [teamTimeZone, setTeamTimeZone] = React.useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kuala_Lumpur');

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const eligible = subActive && teamLevel >= 2; // Team+ only
  const helperMsg =
    !subActive
      ? 'Your subscription is not active.'
      : teamLevel < 2
      ? 'Your plan does not allow creating a team. Upgrade to Team or Enterprise.'
      : null;

  // default pipeline (minimum viable)
  const defaultPipeline = {
    Prospect: [
      { name: 'New Lead', color: '#64748b' },
      { name: 'Qualified', color: '#0ea5e9' },
    ],
    Deal: [
      { name: 'Negotiation', color: '#f59e0b' },
      { name: 'Proposal Sent', color: '#eab308' },
    ],
    Outcome: [
      { name: 'Won', color: '#10b981', isWon: true },
      { name: 'Lost', color: '#ef4444', isLost: true },
    ],
    Ongoing: [
      { name: 'Follow Up', color: '#8b5cf6', isFollowUpStage: true },
      { name: 'Onboarding', color: '#22c55e' },
    ],
  };

  async function createTeam(e) {
    e.preventDefault();
    if (!eligible || saving) return;

    setSaving(true);
    setError('');
    try {
      const body = {
        name: (teamName || '').trim(),
        meta: {
          teamBasedCountry,
          teamCurrency,
          teamTimeZone,
        },
        // hantar sebagai OBJECT (controller kau dah support object/array)
        pipeline: defaultPipeline,
      };
      const res = await toolsApi.post('/api/salestrack/teams/setup', body, { timeout: 20000 });
      // success → pergi ke team list / dashboard
      if (typeof refreshTeams === 'function') {
        await refreshTeams();
      }
      // Navigate ke halaman members atau contacts ikut preference
      navigate('/salestrack/contacts', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to create team.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">Create Your Team</h1>
      <p className="text-sm text-slate-500 mt-1">
        Set up your team and default sales pipeline. You can edit these later in Team Settings.
      </p>

      {/* entitlement info */}
      <div className="mt-4 rounded-md border bg-white p-4 text-sm">
        <div><b>Plan:</b> {planCode || '—'}</div>
        <div><b>Status:</b> {status || '—'}</div>
        <div><b>Team Level:</b> {teamLevel}</div>
        <div><b>Team Limit:</b> {Number.isFinite(teamLimit) ? teamLimit : '∞'}</div>
      </div>

      {!eligible && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
          {helperMsg}
          {' '}
          <a className="underline font-medium" href="/store?tool=salestrack">Change plan</a>
        </div>
      )}

      <form onSubmit={createTeam} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Team Name</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Enter team name"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Country</label>
            <input
              type="text"
              value={teamBasedCountry}
              onChange={(e) => setTeamBasedCountry(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="MY"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Currency</label>
            <input
              type="text"
              value={teamCurrency}
              onChange={(e) => setTeamCurrency(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="MYR"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Time Zone</label>
            <input
              type="text"
              value={teamTimeZone}
              onChange={(e) => setTeamTimeZone(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Asia/Kuala_Lumpur"
            />
          </div>
        </div>

        <div className="rounded-md border bg-slate-50 p-3 text-sm text-slate-600">
          Default pipeline will include: Prospect (New Lead, Qualified), Deal (Negotiation, Proposal Sent), Outcome (Won, Lost), Ongoing (Follow Up, Onboarding).
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <a href="/salestrack" className="px-4 py-2 rounded border">Cancel</a>
          <button
            type="submit"
            disabled={!eligible || saving || !teamName?.trim()}
            className="rounded-md bg-slate-900 px-4 py-2 text-white font-semibold disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create Team'}
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
