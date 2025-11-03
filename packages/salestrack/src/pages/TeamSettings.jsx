// src/pages/TeamSettings.jsx
import React from "react";
import { toolsApi } from "@suite/api-clients";
import StageEditor from "../components/wizard/StageEditor.jsx";
import { useParams, useSearchParams } from "react-router-dom";
import { useTeam } from "@suite/core-context";
import { useAuth } from "@suite/auth";
import { useTeamRole } from "@suite/hooks"; // ⬅️ for role gating

const TOOL_ID = "salestrack";
const CAT_ORDER = ["Prospect", "Deal", "Outcome", "Ongoing"];

const uid = () =>
  (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) +
  Date.now().toString(36);

function withIds(pipelineObj) {
  return Object.fromEntries(
    Object.entries(pipelineObj).map(([k, arr]) => [
      k,
      (arr || []).map((s) => ({ _id: uid(), ...s })),
    ])
  );
}
function emptyPipeline() {
  return { Prospect: [], Deal: [], Outcome: [], Ongoing: [] };
}
function toPipelineObjectFromDB(statuses = []) {
  const obj = { Prospect: [], Deal: [], Outcome: [], Ongoing: [] };
  [...statuses]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((s) => {
      const cat = CAT_ORDER.includes(s.category) ? s.category : "Prospect";
      obj[cat].push({
        name: s.name,
        category: cat,
        color: s.color || "",
        isWon: !!s.isWon,
        isLost: !!s.isLost,
        isFollowUpStage: !!s.isFollowUpStage,
        slaDays: s.slaDays ?? null,
        wipLimit: s.wipLimit ?? null,
      });
    });
  return obj;
}
function buildPayload(pipeline) {
  let order = 1;
  const out = {};
  CAT_ORDER.forEach((cat) => {
    out[cat] = (pipeline[cat] || []).map((s) => {
      // guards:
      const allowWonLost = cat === "Outcome" || cat === "Ongoing";
      const isWon = allowWonLost ? !!s.isWon : false;
      const isLost = allowWonLost ? (!!s.isLost && !isWon) : false; // mutually exclusive client-side
      const isFollowUpStage = !!s.isFollowUpStage;

      return {
        name: (s.name || "").trim(),
        category: cat,
        color: s.color || null,
        order: order++,
        isWon,
        isLost,
        isFollowUpStage,
        slaDays: s.slaDays ?? null,
        wipLimit: s.wipLimit ?? null,
      };
    });
  });
  return out;
}
function sanitizePipelineForCompare(p) {
  const x = {};
  CAT_ORDER.forEach((k) => {
    x[k] = (p[k] || []).map(
      ({ name, category, color, isWon, isLost, isFollowUpStage, slaDays, wipLimit }) => ({
        name,
        category,
        color: color || "",
        isWon: !!isWon,
        isLost: !!isLost,
        isFollowUpStage: !!isFollowUpStage,
        slaDays: slaDays ?? null,
        wipLimit: wipLimit ?? null,
      })
    );
  });
  return x;
}

// inline entitlement reader
const readLimitNumber = (f, dflt) => {
  if (!f) return dflt;
  if (f.limit === null || f.limitInt === null || f.limitText === null) return Infinity;
  const raw = f.limit ?? f.limitInt ?? f.limitText;
  const n = Number(raw);
  return Number.isFinite(n) ? n : dflt;
};

// === Badge helpers (paste near top of file) ===
const planLabel = (code) => {
  switch (code) {
    case 'ST_PRO_INDIVIDUAL_MONTHLY': return 'Individual Plan';
    case 'ST_PRO_TEAM_MONTHLY':       return 'Team Plan';
    case 'ST_ENTERPRISE_MONTHLY':     return 'Enterprise Plan';
    default:                          return code || '—';
  }
};

function PillBadge({ children, tone = 'sky' }) {
  // tone: 'sky' | 'amber' | 'emerald' | 'rose' etc (tailwind)
  const base = `inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm`;
  const tones = {
    sky:     'border-sky-300 bg-sky-50 text-sky-700',
    amber:   'border-amber-300 bg-amber-50 text-amber-800',
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    rose:    'border-rose-300 bg-rose-50 text-rose-700',
    slate:   'border-slate-300 bg-slate-50 text-slate-700',
  };
  return <span className={`${base} ${tones[tone] || tones.slate}`}>{children}</span>;
}

const StatusDot = ({ status }) => {
  const map = {
    active:   'bg-emerald-500',
    trialing: 'bg-sky-500',
    past_due: 'bg-amber-500',
    expired:  'bg-rose-500',
    none:     'bg-slate-400',
  };
  const cls = map[status] || map.none;
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />;
};


export default function TeamSettings({ teamId: _teamIdProp }) {
  const { user } = useAuth();
  const { activeTeam, isLoading: teamCtxLoading } = useTeam();

  // resolve teamId (prop -> /:teamId -> ?teamId= -> activeTeam.id)
  const params = useParams?.() || {};
  const [sp] = useSearchParams?.() || [];
  const teamId =
    _teamIdProp || params.teamId || (sp ? sp.get("teamId") : null) || activeTeam?.id;

  // role gating
  const { role: myRole } = useTeamRole(teamId);
  const isOwnerOrAdmin = myRole === "OWNER" || myRole === "ADMIN";

  // entitlements by tool
  const entByTool = user?.suiteEntitlements?.entitlements?.[TOOL_ID] || {};
  const features  = entByTool?.features || {};
  const subStatus = entByTool?.status;
  const planCode  = entByTool?.planCode;

  // plan seats (authoritative if present)
  const planSeatsRaw = entByTool?.plan?.seats;
  const seatsFromPlan =
    planSeatsRaw === null
      ? Infinity
      : (planSeatsRaw === 0 ? Infinity
         : (Number.isFinite(Number(planSeatsRaw)) ? Number(planSeatsRaw) : undefined));
  // plan defaults (fallback)
  const PLAN_DEFAULTS = {
    ST_PRO_INDIVIDUAL_MONTHLY: 1,
    ST_PRO_TEAM_MONTHLY: 5,
    ST_ENTERPRISE_MONTHLY: Infinity,
  };
  const seatsFromPlanCode = PLAN_DEFAULTS[planCode];

  // levels
  const teamLevel = readLimitNumber(features?.ST_TEAM_LEVEL, 1); // 1=Individual, 2=Team, 3=Ent
  const oppsLevel = readLimitNumber(features?.ST_OPPS_LEVEL, 1);

  // final memberLimit priority: feature -> plan.seats -> planCode -> level
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

  // 🚧 ENFORCE ROLE + ENTITLEMENT:
  // Only OWNER/ADMIN + sufficient entitlement can rename/edit
  const canRenameTeam   = isOwnerOrAdmin && teamLevel >= 2;   // Team+
  const canEditPipeline = isOwnerOrAdmin && oppsLevel >= 2;   // Team+

  // local state
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving]   = React.useState(false);
  const [error, setError]     = React.useState("");

  const [team, setTeam]             = React.useState(null);
  const [teamName, setTeamName]     = React.useState("");
  const [pipeline, setPipeline]     = React.useState(emptyPipeline());
  const [initialSnapshot, setInitialSnapshot] = React.useState(null);

  const onUpdateStage = (stageKey, statuses) =>
    setPipeline((prev) => ({ ...prev, [stageKey]: statuses }));

  const hasChanges = React.useMemo(() => {
    if (!initialSnapshot) return false;
    const now = {
      name: (teamName || "").trim(),
      pipeline: sanitizePipelineForCompare(pipeline),
    };
    return (
      now.name !== initialSnapshot.name ||
      JSON.stringify(now.pipeline) !== JSON.stringify(initialSnapshot.pipeline)
    );
  }, [teamName, pipeline, initialSnapshot]);

  // load data
  React.useEffect(() => {
    if (teamCtxLoading) return;

    if (!teamId) {
      setError("No team selected.");
      setLoading(false);
      return;
    }

    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        let t = null;
        try {
          const tRes = await toolsApi.get(`/api/salestrack/teams/${teamId}`, { timeout: 15000 });
          t = tRes.data;
          if (!alive) return;
          setTeam(t);
          setTeamName(t?.name || "");
        } catch (e) {
          if (e?.response?.status !== 404) throw e;
        }

        const sRes = await toolsApi.get(`/api/salestrack/teams/${teamId}/statuses`, { timeout: 15000 });
        const pipe = withIds(toPipelineObjectFromDB(sRes.data || []));
        if (!alive) return;
        setPipeline(pipe);
        setInitialSnapshot({
          name: t?.name || (teamName || ""),
          pipeline: sanitizePipelineForCompare(pipe),
        });
      } catch (e) {
        console.error("[TeamSettings] load failed:", e);
        if (alive) setError(e?.response?.data?.error || "Failed to load team settings.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [teamId, teamCtxLoading]);

  // actions
  const saveAll = async () => {
    setSaving(true);
    setError("");
    try {
      // rename (role + entitlement)
      if (canRenameTeam && ((team?.name || "") !== (teamName || "").trim())) {
        try {
          await toolsApi.put(
            `/api/salestrack/teams/${teamId}`,
            { name: teamName.trim() },
            { timeout: 15000 }
          )
        } catch (e) {
          if (e?.response?.status !== 404) throw e;
        }
      }

      // pipeline (role + entitlement)
      if (canEditPipeline) {
        // === PRE-VALIDATE WON/LOST RULES
        for (const cat of CAT_ORDER) {
          const arr = pipeline[cat] || [];
          for (const s of arr) {
            const allowWonLost = cat === "Outcome" || cat === "Ongoing";
            if (!allowWonLost && (s.isWon || s.isLost)) {
              throw new Error(`Won/Lost only allowed in Outcome or Ongoing (found in ${cat}: "${s.name}")`);
            }
            if ((s.isWon && s.isLost)) {
              throw new Error(`Status "${s.name}" cannot be both Won and Lost`);
            }
          }
        }
      
        const body = buildPayload(pipeline);
        await toolsApi.post(
          `/api/salestrack/teams/${teamId}/statuses`,
          body,
          { timeout: 20000 }
        );
      }

      setInitialSnapshot({
        name: (teamName || "").trim(),
        pipeline: sanitizePipelineForCompare(pipeline),
      });
    } catch (e) {
      console.error("[TeamSettings] save failed:", e);
      setError(e?.response?.data?.error || "Failed to save settings.");
    } finally {
      setSaving(false);
      window.location.reload();
    }
  };

  const resetFromServer = async () => {
    if (!teamId) return;
    setLoading(true);
    setError("");
    try {
      let t = null;
      try {
        const tRes = await toolsApi.get(`/api/salestrack/teams/${teamId}`, { timeout: 15000 });
        t = tRes.data;
        setTeam(t);
        setTeamName(t?.name || "");
      } catch (e) {
        if (e?.response?.status !== 404) throw e;
      }
      const sRes = await toolsApi.get(`/api/salestrack/teams/${teamId}/statuses`, { timeout: 15000 });
      const pipe = withIds(toPipelineObjectFromDB(sRes.data || []));
      setPipeline(pipe);
      setInitialSnapshot({
        name: t?.name || (teamName || ""),
        pipeline: sanitizePipelineForCompare(pipe),
      });
    } catch (e) {
      console.error("[TeamSettings] reset failed:", e);
      setError(e?.response?.data?.error || "Failed to reload settings.");
    } finally {
      setLoading(false);
    }
  };

  // render
  if (teamCtxLoading) {
    return <div className="p-6"><p className="text-slate-600">Loading teams…</p></div>;
  }
  if (!teamId) {
    return <div className="p-6"><p className="text-slate-600">Please select a team.</p></div>;
  }

  const readOnlyRename   = !canRenameTeam;
  const readOnlyPipeline = !canEditPipeline;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
  <div className="space-y-2">
    <h1 className="text-xl font-semibold">Team Settings</h1>
    <div className="flex flex-wrap items-center gap-2">
      <PillBadge tone="sky">
        {planLabel(planCode)} <span>•</span> <StatusDot status={subStatus} /> 
        <span className="capitalize">{subStatus || '—'}</span>
        <span>•</span> <span className="font-medium">{myRole || '—'}</span>
      </PillBadge>

      <PillBadge tone="slate">
        Member cap: <b>{Number.isFinite(memberLimit) ? memberLimit : '∞'}</b>
      </PillBadge>
    </div>
  </div>

  <div className="text-sm text-slate-500">
    Team ID: <span className="font-mono">{teamId}</span>
  </div>
</div>


      {(readOnlyRename || readOnlyPipeline) && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
          Some settings are read-only for your role/plan.{" "}
          <a className="underline font-medium" href="/store?tool=salestrack">Upgrade plan</a> or contact your admin.
        </div>
      )}

      {/* Team name */}
      <section className="rounded-md border p-6 mb-6 bg-white">
        <h2 className="text-lg font-semibold">Team</h2>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">Team Name</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50"
            placeholder="Enter team name"
            disabled={readOnlyRename}
          />
          {readOnlyRename && (
            <p className="mt-1 text-xs text-slate-500">
              Only OWNER/ADMIN on Team plans and above can rename.
            </p>
          )}
        </div>
      </section>

      {/* Pipeline */}
      <section className="rounded-md border p-6 bg-white">
        <h2 className="text-lg font-semibold">Sales Pipeline</h2>
        <p className="text-slate-500 text-sm mt-1">
          Edit, choose colour and order of team statuses.
        </p>

        <div className={`mt-6 space-y-8 ${readOnlyPipeline ? "pointer-events-none opacity-70" : ""}`}>
          <StageEditor stageKey="Prospect" title="Prospect / Lead" note="Early stage." statuses={pipeline.Prospect} onUpdate={onUpdateStage} />
          <StageEditor stageKey="Deal" title="Deal" note="Negotiation/offer." statuses={pipeline.Deal} onUpdate={onUpdateStage} />
          <StageEditor stageKey="Outcome" title="Outcome" note="Result stage." statuses={pipeline.Outcome} onUpdate={onUpdateStage} />
          <StageEditor stageKey="Ongoing" title="Ongoing" note="Post-sales / retention." statuses={pipeline.Ongoing} onUpdate={onUpdateStage} />
        </div>

        <div className="mt-8 flex items-center justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={resetFromServer}
            className="rounded-md border px-4 py-2 text-slate-700"
            disabled={saving}
            title="Reload from server"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={saveAll}
            disabled={saving || !hasChanges || (readOnlyPipeline && readOnlyRename)}
            className="rounded-md bg-slate-900 px-4 py-2 text-white font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </section>

      {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}
