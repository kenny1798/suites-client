import React, { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@suite/auth';
import { useTeam } from '@suite/core-context';
import { toolsApi } from '@suite/api-clients';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useManagerReps } from '../hooks/useManagerReps';

import InviteModal from '../components/team/InviteModal.jsx';
import JoinRequestsPanel from '../components/team/JoinRequestsPanel.jsx';
import AssignModal from '../components/team/AssignModal.jsx';

const TOOL_ID = 'salestrack';

// --- tiny helpers
function RoleBadge({ role }) {
  const map = {
    OWNER: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-indigo-100 text-indigo-800',
    MANAGER: 'bg-amber-100 text-amber-800',
    SALES_REP: 'bg-slate-100 text-slate-800',
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-semibold ${
        map[role] || 'bg-slate-100 text-slate-800'
      }`}
    >
      {role?.replace('_', ' ') || '—'}
    </span>
  );
}

// helper: normalize row -> pastikan ada { user, manager }
function normalizeMemberRow(r) {
  const user = r.user || r.User || null;
  const manager = r.manager || r.Manager || null;
  return { ...r, user, manager };
}

function MemberRow({ m, right, subtitle }) {
  const u = m.user ?? m.User ?? null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b last:border-b-0">
      <div>
        <div className="font-medium">{m.user?.name || 'Unknown User'}</div>
        <div className="text-xs text-slate-500">{m.user?.email}</div>
        {subtitle ? (
          <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
        ) : null}
      </div>
      <div className="flex items-center gap-2 sm:self-end">
        <RoleBadge role={m.role} />
        {right}
      </div>
    </div>
  );
}

export default function TeamMembersPage() {
  const { user } = useAuth();
  const { activeTeam } = useTeam();
  const teamId = activeTeam?.id;

  const { members, loading, error, refresh } = useTeamMembers(teamId);
  const safeRefresh = typeof refresh === 'function' ? refresh : async () => {};

  // local mirror supaya boleh optimistic update + sync semula dari API
  const [membersLocal, setMembersLocal] = useState([]);
  useEffect(() => {
    const arr = Array.isArray(members) ? members.map(normalizeMemberRow) : [];
    setMembersLocal(arr);
  }, [members]);
 

  // hard reload direct dari backend (pastikan /members include Manager)
  const loadMembersDirect = async () => {
    if (!teamId) return;
    try {
      const res = await toolsApi.get(`/api/salestrack/teams/${teamId}/members`, { timeout: 15000 });
      const arr = Array.isArray(res.data) ? res.data.map(normalizeMemberRow) : [];
      setMembersLocal(arr);   
    } catch (e) {
      console.error('reload members failed', e);
    }
  };

  // dipanggil bila child (JoinRequestsPanel) approve/reject
  const handleAfterJoinAction = async () => {
    if (typeof refresh === 'function') await refresh();
    else await loadMembersDirect();
    await reloadReporting(); // refresh subtitle manager juga
  };

  // My role
  const myMembership = useMemo(
    () => (membersLocal || []).find((m) => String(m.userId) === String(user?.id)),
    [membersLocal, user]
  );
  const myRole = myMembership?.role;

  // Manager-scoped reps (untuk view MANAGER)
  const { reps: managerReps, loading: repsLoading } = useManagerReps(
    teamId,
    myRole === 'MANAGER' ? user?.id : null
  );
  const managerRepIdSet = useMemo(
    () => new Set((managerReps || []).map((u) => String(u.id))),
    [managerReps]
  );

  // === manager map: repUserId -> { id, name, email }
  const [repManagerMap, setRepManagerMap] = useState(new Map());

  const reloadReporting = React.useCallback(async () => {
    if (!teamId) return;
    try {
      // Ambil terus dari /members (backend perlu include { manager })
      const res = await toolsApi.get(`/api/salestrack/teams/${teamId}/members`, { timeout: 15000 });
      const map = new Map();
      (res.data || []).forEach((m) => {
        if (m.role === 'SALES_REP' && m.manager?.id) {
          map.set(String(m.userId), {
            id: m.manager.id,
            name: m.manager.name,
            email: m.manager.email,
          });
        }
      });
      // Jika viewer MANAGER, pastikan reps dia ada label walaupun manager tak balik
      if (myRole === 'MANAGER') {
        (managerReps || []).forEach((r) => {
          const repId = String(r.id);
          if (!map.has(repId)) {
            map.set(repId, { id: user?.id, name: user?.name, email: user?.email });
          }
        });
      }
      setRepManagerMap(map);
    } catch (e) {
      console.error('reloadReporting failed', e);
      setRepManagerMap(new Map());
    }
  }, [teamId, myRole, managerReps, user?.id, user?.name, user?.email]);

  useEffect(() => { reloadReporting(); }, [reloadReporting]);

  // Counts (total vs. cap)
  const entByTool = user?.suiteEntitlements?.entitlements?.[TOOL_ID] || {};
  const features = entByTool?.features || {};
  const fMember = features?.ST_MEMBER_LIMIT;
  const cap =
    fMember?.limit === null || fMember?.limitInt === null || fMember?.limitText === null
      ? Infinity
      : Number(fMember?.limit ?? fMember?.limitInt ?? fMember?.limitText ?? 1);
  const totalActive = membersLocal?.length || 0;
  const atCap = Number.isFinite(cap) ? totalActive >= cap : false;

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);

  // Assign modal
  const [assignModal, setAssignModal] = useState(null); // { memberId, memberName }
  const [managers, setManagers] = useState([]);
  const [assigning, setAssigning] = useState(false);

  // Load managers bila modal opened
  useEffect(() => {
    if (!assignModal || !teamId) return;
    (async () => {
      try {
        const res = await toolsApi.get(`/api/salestrack/teams/${teamId}/managers`, { timeout: 15000 });
        setManagers(res.data || []);
      } catch (e) {
        console.error('Failed to load managers', e);
        setManagers([]);
      }
    })();
  }, [assignModal, teamId]);

  const canView = myRole === 'OWNER' || myRole === 'ADMIN' || myRole === 'MANAGER';

  // Actions
  const handleRemove = async (member) => {
    const name = member.user?.name || 'this member';
    if (!window.confirm(`Remove ${name}? They can be re-invited later.`)) return;
    try {
      await toolsApi.delete(`/api/salestrack/teams/${teamId}/members/${member.id}`, { timeout: 20000 });
      // optimistic update
      setMembersLocal((prev) => prev.filter((m) => m.id !== member.id));
      await safeRefresh();
      await reloadReporting();
    } catch (err) {
      console.log(err);
      alert(err?.response?.data?.error || 'Failed to remove member.');
    }
  };

  const handleAssign = async (managerUserId) => {
    if (!assignModal) return;
    setAssigning(true);
    try {
      await toolsApi.post(
        `/api/salestrack/teams/${teamId}/members/${assignModal.memberId}/assign`,
        { managerUserId },
        { timeout: 20000 }
      );
      setAssignModal(null);
      await safeRefresh();
      await reloadReporting(); // update subtitle manager
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to assign member.');
    } finally {
      setAssigning(false);
    }
  };

  if (!teamId) return <div className="p-6">Please select a team.</div>;

  if (!canView) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Team Members</h1>
        <p className="text-slate-600 mt-2">You don’t have permission to view this page.</p>
      </div>
    );
  }

  const owners       = membersLocal.filter((m) => m.role === 'OWNER');
  const admins       = membersLocal.filter((m) => m.role === 'ADMIN');
  const managersOnly = membersLocal.filter((m) => m.role === 'MANAGER');
  const reps         = membersLocal.filter((m) => m.role === 'SALES_REP');

  // Capacity banner (owner/admin only)
  const showCapBanner = (myRole === 'OWNER' || myRole === 'ADMIN') && Number.isFinite(cap);

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Team Members</h1>
          <p className="text-slate-500">{activeTeam?.name}</p>
        </div>

        {(myRole === 'OWNER' || myRole === 'ADMIN' || myRole === 'MANAGER') && (
          <button
            className="rounded-md bg-slate-900 px-4 py-2 text-white font-semibold disabled:opacity-50"
            onClick={() => setShowInvite(true)}
            disabled={(myRole === 'OWNER' || myRole === 'ADMIN') ? atCap : false}
          >
            Invite
          </button>
        )}
      </div>

      {showCapBanner && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
          Members: <b>{totalActive}</b> / <b>{Number.isFinite(cap) ? cap : '∞'}</b>.
          {atCap && (
            <>
              {' '}Capacity reached.{' '}
              <a className="underline font-medium" href="/store?tool=salestrack">
                Upgrade plan
              </a>{' '}
              to add more.
            </>
          )}
        </div>
      )}

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
          {/* Owners */}
          <section className="bg-white rounded-md border p-4 sm:p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Owners</h2>
              <div className="text-sm text-slate-500">{owners.length} owner(s)</div>
            </div>
            {owners.length === 0 ? (
              <p className="text-sm text-slate-500">No owners.</p>
            ) : (
              owners.map((m) => <MemberRow key={`o-${m.id}`} m={m} />)
            )}
          </section>

          {/* Admins */}
          <section className="bg-white rounded-md border p-4 sm:p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Admins</h2>
              <div className="text-sm text-slate-500">{admins.length} admin(s)</div>
            </div>
            {admins.length === 0 ? (
              <p className="text-sm text-slate-500">No admins.</p>
            ) : (
              admins.map((m) => {
                const canRemove = myRole === 'OWNER' || myRole === 'ADMIN';
                return (
                  <MemberRow
                    key={`a-${m.id}`}
                    m={m}
                    right={
                      canRemove && (
                        <button
                          className="text-xs px-2 py-1 border rounded text-red-600 hover:bg-red-50"
                          onClick={() => handleRemove(m)}
                        >
                          Remove
                        </button>
                      )
                    }
                  />
                );
              })
            )}
          </section>

          {/* Managers */}
          <section className="bg-white rounded-md border p-4 sm:p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Managers</h2>
              <div className="text-sm text-slate-500">{managersOnly.length} manager(s)</div>
            </div>
            {managersOnly.length === 0 ? (
              <p className="text-sm text-slate-500">No managers.</p>
            ) : (
              managersOnly.map((m) => {
                const canRemove = myRole === 'OWNER' || myRole === 'ADMIN';
                return (
                  <MemberRow
                    key={`m-${m.id}`}
                    m={m}
                    right={
                      canRemove && (
                        <button
                          className="text-xs px-2 py-1 border rounded text-red-600 hover:bg-red-50"
                          onClick={() => handleRemove(m)}
                        >
                          Remove
                        </button>
                      )
                    }
                  />
                );
              })
            )}
          </section>

          {/* Members (Sales Reps) */}
          <section className="bg-white rounded-md border p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Members</h2>
              <div className="text-sm text-slate-500">{reps.length} member(s)</div>
            </div>
            {reps.length === 0 ? (
              <p className="text-sm text-slate-500">No members.</p>
            ) : (
              reps.map((m) => {
                const canAssign = myRole === 'OWNER' || myRole === 'ADMIN';
                const canRemove =
                  myRole === 'OWNER' || myRole === 'ADMIN' ||
                  (myRole === 'MANAGER' && managerRepIdSet.has(String(m.userId)));

                  const subtitle = m.manager ? `Manager: ${m.manager.name}` : undefined;

                return (
                  <MemberRow
                    key={`r-${m.id}`}
                    m={m}
                    subtitle={subtitle}
                    right={
                      <div className="flex items-center gap-2">
                        {canAssign && (
                          <button
                            className="text-xs px-2 py-1 border rounded hover:bg-slate-50"
                            onClick={() =>
                              setAssignModal({ memberId: m.id, memberName: m.user?.name || 'Member' })
                            }
                          >
                            Assign
                          </button>
                        )}
                        {canRemove && (
                          <button
                            className="text-xs px-2 py-1 border rounded text-red-600 hover:bg-red-50"
                            onClick={() => handleRemove(m)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    }
                  />
                );
              })
            )}
          </section>
        </>
      )}

      {(myRole === 'OWNER' || myRole === 'ADMIN' || myRole === 'MANAGER') && (
        <div className="my-6">
          <JoinRequestsPanel teamId={teamId} onAfterAction={handleAfterJoinAction} />
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <InviteModal
          open={showInvite}
          onClose={() => setShowInvite(false)}
          managers={managers}
          myRole={myRole}
        />
      )}

      {/* Assign modal */}
      <AssignModal
        open={!!assignModal}
        onClose={() => setAssignModal(null)}
        managers={managers}
        onAssign={handleAssign}
        memberName={assignModal?.memberName}
        loading={assigning}
      />
    </div>
  );
}
