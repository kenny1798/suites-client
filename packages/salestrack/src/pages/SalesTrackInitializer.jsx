// packages/salestrack/src/pages/SalesTrackInitializer.jsx
import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTeam } from '@suite/core-context';
import { useAuth } from '@suite/auth';
import { useMySubs } from '@suite/hooks'; // ⬅️ check direct sub (DB truth)
import SetupWizard from './SetupWizard.jsx';

export default function SalesTrackInitializer() {
  const navigate = useNavigate();
  const { activeTeam, isLoading: teamLoading, teams = [] } = useTeam() || {};
  const { has, limit, entitlementsFor } = useAuth();
  const { loading: subsLoading, map: subsMap } = useMySubs();

  // ==== Entitlements (OS-level) ====
  const st = entitlementsFor('salestrack'); // { status, planCode, features }
  const teamLevel = Number(limit('salestrack', 'ST_TEAM_LEVEL', 1)); // 1=solo, 2=single+invite, 3=multi
  const teamCap   = safeNum(limit('salestrack', 'ST_TEAM_LIMIT', teamLevel >= 3 ? 5 : 1)); // default 5 if multi
  const memberCap = safeNum(limit('salestrack', 'ST_MEMBER_LIMIT', teamLevel === 1 ? 1 : 5));
  const canExport = !!has('salestrack', 'ST_EXPORT_DATA');
  const canAdv    = !!has('salestrack', 'ST_ADVANCED_STATS');

  // ==== Direct subscription (truth) ====
  const mySub = subsMap?.['salestrack'] || null;
  const isDirectActive = ['active', 'trialing'].includes((mySub?.status || '').toLowerCase());

  // ==== Team metrics (OWNED vs all) ====
  const metrics = useMemo(() => {
    const arr = Array.isArray(teams) ? teams : [];

    // role OWNER detector (inline .role or TeamMembers[0].role)
    const isOwner = (t) => {
      if (t?.role) return t.role === 'OWNER';
      const tm = Array.isArray(t?.TeamMembers) ? t.TeamMembers[0] : null;
      return tm?.role === 'OWNER';
    };

    const ownedTeamCount = arr.filter(isOwner).length;

    // activeTeam members + my role
    const members = getMembers(activeTeam);

    return {
      ownedTeamCount,
      allTeamCount: arr.length,
      memberCount: members.count,
      myRole: members.myRole,
    };
  }, [teams, activeTeam]);

  // ==== CTA decisions (pakai OWNED + direct sub) ====
  const canCreateAnotherTeam =
    teamLevel === 3 && isDirectActive && metrics.ownedTeamCount < teamCap;

  const canInviteMembers =
    teamLevel >= 2 && metrics.memberCount < memberCap;

  const overMemberLimit = metrics.memberCount > memberCap;
  const atMemberLimit   = metrics.memberCount === memberCap;
  const atTeamLimit     = teamLevel === 3 && metrics.ownedTeamCount >= teamCap;

  // ==== Routing helpers ====
  const goInvite = () => navigate('/salestrack/team/members');
  const goCreateTeam = () => navigate('/salestrack/setup-my-team'); // better dedicated create flow
  const goUpgrade = () => navigate('/store?tool=salestrack');

  // ==== Loading → SetupWizard logic (owner first team only) ====
  if (!teamLoading && !subsLoading && !activeTeam) {
    // No active team selected → first-time setup for owner with direct active handled in AccessGate
    return <SetupWizard />;
  }

  // ==== Main ====
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">SalesTrack</h1>
        <PlanBadge status={st?.status} planCode={st?.planCode} />
      </div>

      {/* Usage panel (use OWNED counts) */}
      <UsagePanel
        teamLevel={teamLevel}
        teamCap={teamCap}
        memberCap={memberCap}
        teamCount={metrics.ownedTeamCount}    // ⬅️ OWNED
        memberCount={metrics.memberCount}
        overMemberLimit={overMemberLimit}
        atMemberLimit={atMemberLimit}
        atTeamLimit={atTeamLimit}
        canInviteMembers={canInviteMembers}
        canCreateAnotherTeam={canCreateAnotherTeam}
        onInvite={goInvite}
        onCreateTeam={goCreateTeam}
        onUpgrade={goUpgrade}
      />

      {/* Quick navigation */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card
          title="Contacts"
          desc="Add leads and clients you’re talking to."
          to="/salestrack/contacts"
        />
        <Card
          title="Opportunities"
          desc="Track deals across your pipeline."
          to="/salestrack/opportunities"
        />
        <Card
          title="Performance"
          desc={canAdv ? 'Advanced charts & insights.' : 'Track your performance.'}
          to="/salestrack/performance"
          badge={canAdv ? 'Advanced' : null}
        />
        <Card
          title="Tasks"
          desc="View your day to day tasks."
          to="/salestrack/opportunities"
        />
      </div>

      <div className="text-sm text-gray-500">
        Active team: <b>{activeTeam?.name || '—'}</b>
      </div>

      {/* Helpful links */}
      <div className="mt-4 text-sm">
        {canExport ? (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Export enabled
          </span>
        ) : (
          <button onClick={goUpgrade} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Unlock Export
          </button>
        )}
      </div>
    </div>
  );
}

/* =======================
 * Components & helpers
 * ======================= */

function UsagePanel({
  teamLevel,
  teamCap,
  memberCap,
  teamCount,        // already OWNED
  memberCount,
  overMemberLimit,
  atMemberLimit,
  atTeamLimit,
  canInviteMembers,
  canCreateAnotherTeam,
  onInvite,
  onCreateTeam,
  onUpgrade,
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="border rounded-xl p-5 bg-white">
        <div className="font-medium">Team Access</div>
        <div className="text-sm text-gray-600 mt-1">
          {teamLevel === 1 && 'Individual plan: Solo team for personal use.'}
          {teamLevel === 2 && 'Team plan: Invite members to 1 team.'}
          {teamLevel === 3 && 'Enterprise: Manage multiple teams.'}
        </div>

        <div className="mt-3 text-sm">
          <UsageLine label="Teams (owned)" value={`${teamCount} / ${fmtCap(teamCap)}`} warn={teamLevel === 3 && atTeamLimit} />
          <UsageLine label="Members (active team)" value={`${memberCount} / ${fmtCap(memberCap)}`} warn={overMemberLimit || atMemberLimit} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {canInviteMembers && (
            <button onClick={onInvite} className="px-3 py-2 rounded-lg border bg-indigo-600 text-white hover:bg-indigo-700">
              Invite Members
            </button>
          )}
          {!canInviteMembers && (atMemberLimit || overMemberLimit) && (
            <button onClick={onUpgrade} className="px-3 py-2 rounded-lg border bg-amber-500 text-white hover:bg-amber-600">
              Upgrade to increase member limit
            </button>
          )}
          {canCreateAnotherTeam && (
            <button onClick={onCreateTeam} className="px-3 py-2 rounded-lg border bg-slate-100 hover:bg-slate-200">
              Create New Team
            </button>
          )}
          {!canCreateAnotherTeam && teamLevel === 3 && atTeamLimit && (
            <button onClick={onUpgrade} className="px-3 py-2 rounded-lg border bg-amber-500 text-white hover:bg-amber-600">
              Upgrade to increase team limit
            </button>
          )}
        </div>
      </div>

      <div className="border rounded-xl p-5 bg-white">
        <div className="font-medium">Tips</div>
        <ul className="text-sm text-gray-600 mt-1 list-disc ml-5 space-y-1">
          <li>Set up your pipeline stages in <Link to="/salestrack/team/settings" className="underline">Team Settings</Link>.</li>
          <li>Invite your teammates once your stages are ready.</li>
          <li>Track daily progress in the Performance section.</li>
        </ul>
      </div>
    </div>
  );
}

function UsageLine({ label, value, warn }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-gray-600">{label}</span>
      <span className={warn ? 'text-amber-600 font-medium' : 'text-gray-800 font-medium'}>{value}</span>
    </div>
  );
}

function PlanBadge({ status, planCode }) {
  if (!status && !planCode) return null;
  const tone =
    status === 'trialing' ? 'bg-sky-50 text-sky-700 border-sky-200'
    : status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : status === 'past_due' || status === 'expired' ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-slate-50 text-slate-700 border-slate-200';
  return (
    <div className={`px-3 py-1 rounded-full text-xs border ${tone}`}>
      {planCode === 'ST_PRO_INDIVIDUAL_MONTHLY' ? 'Individual' : planCode === 'ST_PRO_TEAM_MONTHLY' ? 'Team' : 'Enterprise'} Plan · {status || '—'}
    </div>
  );
}

function Card({ title, desc, to, badge }) {
  return (
    <div className="border rounded-xl p-5 bg-white">
      <div className="flex items-center justify-between">
        <div className="font-medium">{title}</div>
        {badge ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="text-sm text-gray-600 mt-1">{desc}</div>
      <Link to={to} className="inline-block mt-3 text-sm underline">Open</Link>
    </div>
  );
}

function getMembers(team) {
  if (!team) return { count: 0, myRole: null };
  const arr = team.TeamMembers || team.members || [];
  const count = Array.isArray(arr) ? arr.length : 0;
  const myRole = arr?.[0]?.role || team.role || null;
  return { count, myRole };
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtCap(v) {
  if (v === null || v === undefined) return '∞';
  return String(v);
}
