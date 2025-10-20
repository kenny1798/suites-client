import React, { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@suite/auth';
import { useTeam } from '@suite/core-context';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useManagerReps } from '../hooks/useManagerReps';

// ⬇️ NEW: modal
import InviteModal from '../components/team/InviteModal.jsx';
import JoinRequestsPanel from '../components/team/JoinRequestsPanel.jsx'

function RoleBadge({ role }) {
  const map = {
    OWNER: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-indigo-100 text-indigo-800',
    MANAGER: 'bg-amber-100 text-amber-800',
    SALES_REP: 'bg-slate-100 text-slate-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[role] || 'bg-slate-100 text-slate-800'}`}>
      {role.replace('_', ' ')}
    </span>
  );
}

function MemberRow({ m }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div>
        <div className="font-medium">{m.user?.name || 'Unknown User'}</div>
        <div className="text-xs text-slate-500">{m.user?.email}</div>
      </div>
      <RoleBadge role={m.role} />
    </div>
  );
}

export default function TeamMembersPage() {
  const { user } = useAuth();
  const { activeTeam } = useTeam();

  const teamId = activeTeam?.id;
  const { members, loading, error } = useTeamMembers(teamId);

  // figure out my role in this team
  const myMembership = useMemo(
    () => members.find(m => String(m.userId) === String(user?.id)),
    [members, user]
  );
  const myRole = myMembership?.role; // OWNER | ADMIN | MANAGER | SALES_REP

  // expose role globally for the modal (kept simple)
  useEffect(() => { window.__teamRole = myRole || null; }, [myRole]);

  // manager: fetch reps under me
  const { reps: managerReps, loading: repsLoading } = useManagerReps(
    teamId,
    myRole === 'MANAGER' ? user?.id : null
  );

  // permission: OWNER / ADMIN / MANAGER can view the page
  const canView = myRole === 'OWNER' || myRole === 'ADMIN' || myRole === 'MANAGER';

  const grouped = useMemo(() => {
    if (!members?.length) return { owners: [], admins: [], managers: [], reps: [] };
    const owners = members.filter(m => m.role === 'OWNER');
    const admins = members.filter(m => m.role === 'ADMIN');
    const managers = members.filter(m => m.role === 'MANAGER');
    const reps = members.filter(m => m.role === 'SALES_REP');
    return { owners, admins, managers, reps };
  }, [members]);

  // reps that report to this manager (for manager view)
  const managerScopedReps = useMemo(() => {
    if (myRole !== 'MANAGER') return [];
    const set = new Set((managerReps || []).map(u => String(u.id)));
    return members.filter(m => m.role === 'SALES_REP' && set.has(String(m.userId)));
  }, [myRole, managerReps, members]);

  // ⬇️ NEW: Invite modal open state
  const [showInvite, setShowInvite] = useState(false);

  // ⬇️ NEW: managers list for the modal (shape expected by InviteModal)
  const managersForModal = useMemo(
    () => grouped.managers.map(m => ({ userId: m.userId, User: m.user })),
    [grouped.managers]
  );

  if (!teamId) return <div className="p-6">Please select a team.</div>;

  if (!canView) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Team Members</h1>
        <p className="text-slate-600 mt-2">You don’t have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Team Members</h1>
          <p className="text-slate-500">
            {activeTeam?.name} • Role: <span className="font-medium">{myRole?.replace('_',' ')}</span>
          </p>
        </div>

        {(myRole === 'OWNER' || myRole === 'ADMIN' || myRole === 'MANAGER') && (
          <button
            className="rounded-md bg-slate-900 px-4 py-2 text-white font-semibold"
            onClick={() => setShowInvite(true)}
          >
            Invite
          </button>
        )}
      </div>

      {(loading || (myRole === 'MANAGER' && repsLoading)) && (
        <div className="rounded-md border p-6">Loading…</div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 p-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {(myRole === 'OWNER' || myRole === 'ADMIN') && (
            <div className="space-y-8">
              {/* Owners */}
              <section className="bg-white rounded-md border p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Owners</h2>
                  <div className="text-sm text-slate-500">{grouped.owners.length} owner(s)</div>
                </div>
                {grouped.owners.length === 0 ? (
                  <p className="text-sm text-slate-500">No owners.</p>
                ) : (
                  grouped.owners.map(m => <MemberRow key={`o-${m.id}`} m={m} />)
                )}
              </section>

              {/* Admins */}
              <section className="bg-white rounded-md border p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Admins</h2>
                  <div className="text-sm text-slate-500">{grouped.admins.length} admin(s)</div>
                </div>
                {grouped.admins.length === 0 ? (
                  <p className="text-sm text-slate-500">No admins.</p>
                ) : (
                  grouped.admins.map(m => <MemberRow key={`a-${m.id}`} m={m} />)
                )}
              </section>

              {/* Managers */}
              <section className="bg-white rounded-md border p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Managers</h2>
                  <div className="text-sm text-slate-500">{grouped.managers.length} manager(s)</div>
                </div>
                {grouped.managers.length === 0 ? (
                  <p className="text-sm text-slate-500">No managers.</p>
                ) : (
                  grouped.managers.map(m => <MemberRow key={`m-${m.id}`} m={m} />)
                )}
              </section>

              {/* Members */}
              <section className="bg-white rounded-md border p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Members</h2>
                  <div className="text-sm text-slate-500">{grouped.reps.length} member(s)</div>
                </div>
                {grouped.reps.length === 0 ? (
                  <p className="text-sm text-slate-500">No members.</p>
                ) : (
                  grouped.reps.map(m => <MemberRow key={`r-${m.id}`} m={m} />)
                )}
              </section>
            </div>
          )}

          {myRole === 'MANAGER' && (
            <div className="space-y-8">
              {/* Manager (self) */}
              <section className="bg-white rounded-md border p-5">
                <h2 className="text-lg font-semibold mb-3">You (Manager)</h2>
                {myMembership ? <MemberRow m={myMembership} /> : <p className="text-sm text-slate-500">Not found.</p>}
              </section>

              {/* Your Members */}
              <section className="bg-white rounded-md border p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Your Members</h2>
                  <div className="text-sm text-slate-500">{managerScopedReps.length} member(s)</div>
                </div>
                {managerScopedReps.length === 0 ? (
                  <p className="text-sm text-slate-500">No assigned members yet.</p>
                ) : (
                  managerScopedReps.map(m => <MemberRow key={`mr-${m.id}`} m={m} />)
                )}
              </section>
            </div>
          )}
        </>
      )}

        {(myRole === 'OWNER' || myRole === 'ADMIN' || myRole === 'MANAGER') && (
        <div className="my-6">
            <JoinRequestsPanel teamId={teamId} />
        </div>
        )}

      {/* ⬇️ Invite modal */}
      {showInvite && (
        <InviteModal
          open={showInvite}
          onClose={() => setShowInvite(false)}
          managers={managersForModal}
        />
      )}


    </div>
  );
}
