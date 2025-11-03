import React from "react";
import { useAuth } from "@suite/auth";
import { useTeam } from "@suite/core-context";
import { toolsApi } from "@suite/api-clients";
import { useInviteHash } from "../../hooks/useInviteHash";

const ROLES = ["ADMIN", "MANAGER", "SALES_REP"];

export default function InviteModal({ open, onClose, managers = [], myRole }) {
  const { user } = useAuth();
  const { activeTeam } = useTeam();
  const teamId = activeTeam?.id;

  const { data: hashInfo, loading: hashLoading, error: hashError } = useInviteHash(teamId);

  const [role, setRole] = React.useState("SALES_REP");
  const [managerId, setManagerId] = React.useState("");
  const [inviteUrl, setInviteUrl] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  // local managers state (self-fetch if prop is empty)
  const [mgrs, setMgrs] = React.useState([]);
  const [mgrLoading, setMgrLoading] = React.useState(false);
  const [mgrErr, setMgrErr] = React.useState("");

  // sync if parent already has managers
  React.useEffect(() => {
    if (Array.isArray(managers) && managers.length > 0) setMgrs(managers);
  }, [managers]);

  // self-fetch when modal opens (if none provided)
  React.useEffect(() => {
    let alive = true;
    const fetchManagers = async () => {
      if (!open || !teamId) return;
      if (Array.isArray(managers) && managers.length > 0) return; // parent supplied
      setMgrLoading(true); setMgrErr("");
      try {
        const res = await toolsApi.get(`/api/salestrack/teams/${teamId}/managers`, { timeout: 15000 });
        if (!alive) return;
        setMgrs(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (alive) setMgrErr(e?.response?.data?.error || "Failed to load managers");
      } finally {
        if (alive) setMgrLoading(false);
      }
    };
    fetchManagers();
    return () => { alive = false; };
  }, [open, teamId, managers]);

  if (!open) return null;

  const isOwnerOrAdmin = myRole === "OWNER" || myRole === "ADMIN";
  const isManager = myRole === "MANAGER";
  const effectiveRole = isManager ? "SALES_REP" : role;

  // reset manager selection bila bukan SALES_REP
  React.useEffect(() => {
    if (effectiveRole !== "SALES_REP" && managerId) setManagerId("");
  }, [effectiveRole, managerId]);

  const generate = () => {
    if (!hashInfo?.hash || !activeTeam?.id || !user?.id) return;
    const base = `/salestrack/invite/${activeTeam.id}/${hashInfo.hash}`;
    let link = isManager ? `${base}/${user.id}` : `${base}/${effectiveRole}/${user.id}`;
    if (!isManager && effectiveRole === "SALES_REP" && managerId) {
      const q = new URLSearchParams({ managerId: String(managerId) }).toString();
      link += `?${q}`;
    }
    setInviteUrl(link);
    setCopied(false);
  };

  const copy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${inviteUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const getId = (m) => m?.id ?? m?.userId ?? m?.user?.id ?? m?.User?.id;
  const getName = (m) => m?.name ?? m?.user?.name ?? m?.User?.name ?? `User #${getId(m)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Invite Members</h2>
          <button onClick={onClose} className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100">✕</button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="text-sm text-slate-600">
            Share this link. Invitee must register/login to request access.
          </div>

          {hashLoading && <div className="rounded-md border p-3 text-sm">Preparing secure link…</div>}
          {hashError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Failed to get invite hash. Please try again.
            </div>
          )}

          {isOwnerOrAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                </select>
              </div>

              {effectiveRole === "SALES_REP" && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Assign Manager (optional)</label>
                  <select
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    disabled={mgrLoading || !!mgrErr || (mgrs?.length ?? 0) === 0}
                  >
                    <option value="">— Select manager —</option>
                    {mgrs.map((m) => {
                      const id = getId(m);
                      const name = getName(m);
                      return <option key={id} value={id}>{name}</option>;
                    })}
                  </select>
                  {mgrLoading && <div className="mt-1 text-xs text-slate-500">Loading managers…</div>}
                  {mgrErr && <div className="mt-1 text-xs text-red-600">{mgrErr}</div>}
                  {!mgrLoading && !mgrErr && mgrs.length === 0 && (
                    <div className="mt-1 text-xs text-slate-500">No managers yet.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {isManager && (
            <div className="rounded-md border p-3 bg-slate-50 text-sm">
              You can invite <b>Members</b>. They will automatically be assigned under you after approval.
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <button
              onClick={generate}
              disabled={hashLoading || !!hashError}
              className="rounded-md bg-slate-900 px-4 py-2 text-white font-semibold disabled:opacity-50"
            >
              Generate Link
            </button>

            {inviteUrl && (
              <>
                <input readOnly className="flex-1 rounded-md border px-3 py-2 text-sm" value={`${window.location.origin}${inviteUrl}`} />
                <button onClick={copy} className="rounded-md border px-3 py-2 text-sm">
                  {copied ? "Copied!" : "Copy"}
                </button>
              </>
            )}
          </div>

          {hashInfo?.teamName && (
            <p className="text-xs text-slate-500">
              Team: <span className="font-medium">{hashInfo.teamName}</span> • Hash synced from server.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
