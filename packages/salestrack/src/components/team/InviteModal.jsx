import React from "react";
import { useAuth } from "@suite/auth";
import { useTeam } from "@suite/core-context";
import { useInviteHash } from "../../hooks/useInviteHash"; // <-- guna hash server

const ROLES = ["ADMIN", "MANAGER", "SALES_REP"];

export default function InviteModal({ open, onClose, managers = [] }) {
  const { user } = useAuth();
  const { activeTeam } = useTeam();
  const teamId = activeTeam?.id;

  const { data: hashInfo, loading: hashLoading, error: hashError } = useInviteHash(teamId);

  const [role, setRole] = React.useState("SALES_REP");
  const [managerId, setManagerId] = React.useState("");
  const [inviteUrl, setInviteUrl] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  if (!open) return null;

  // role semasa user (dipass dari page; kalau nak lebih clean, pakai hook useTeamRole)
  const isOwnerOrAdmin = (window.__teamRole === "OWNER" || window.__teamRole === "ADMIN");
  const isManager = window.__teamRole === "MANAGER";

  // Managers hanya boleh invite SALES_REP
  const effectiveRole = isManager ? "SALES_REP" : role;

  const generate = () => {
    if (!hashInfo?.hash || !activeTeam?.id || !user?.id) return;

    const base = `/salestrack/invite/${activeTeam.id}/${hashInfo.hash}`;

    // Owner/Admin: /invite/:teamId/:hash/:ROLE/:inviterId
    // Manager:      /invite/:teamId/:hash/:inviterId   (role default SALES_REP)
    let link = isManager
      ? `${base}/${user.id}`
      : `${base}/${effectiveRole}/${user.id}`;

    // Optional: kalau Owner/Admin pilih manager untuk rep, kita tambah query param (BE boleh consume nanti)
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

          {/* Hash status */}
          {hashLoading && (
            <div className="rounded-md border p-3 text-sm">Preparing secure link…</div>
          )}
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
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {role === "SALES_REP" && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Assign Manager (optional)</label>
                  <select
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                  >
                    <option value="">— Select manager —</option>
                    {managers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.User?.name || m.userId}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {isManager && (
            <div className="rounded-md border p-3 bg-slate-50 text-sm">
              You can invite <b>Members</b>. They will automatically be assigned under you after approval.
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={generate}
              disabled={hashLoading || !!hashError}
              className="rounded-md bg-slate-900 px-4 py-2 text-white font-semibold disabled:opacity-50"
            >
              Generate Link
            </button>

            {inviteUrl && (
              <>
                <input
                  readOnly
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                  value={`${window.location.origin}${inviteUrl}`}
                />
                <button onClick={copy} className="rounded-md border px-3 py-2 text-sm">
                  {copied ? "Copied!" : "Copy"}
                </button>
              </>
            )}
          </div>

          {/* Footnote kecil tentang scope link */}
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
