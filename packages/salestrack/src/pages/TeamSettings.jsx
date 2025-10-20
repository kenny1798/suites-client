import React from "react";
import { toolsApi } from "@suite/api-clients";
import StageEditor from "../components/wizard/StageEditor.jsx";
// (optional) kalau kau guna react-router
import { useParams, useSearchParams } from "react-router-dom";
import { useTeam } from "@suite/core-context";
import ProductsPanel from '../components/ProductsPanel.jsx'
import InviteByLinkPanel from '../components/team/InviteByLinkPanel';

// --- utils
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
  // DB -> { Prospect:[{name,color,category}], ... } (ikut order)
  const obj = emptyPipeline();
  [...statuses]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((s) => {
      const cat = CAT_ORDER.includes(s.category) ? s.category : "Prospect";
      obj[cat].push({
        name: s.name,
        category: cat,
        color: s.color || "",
      });
    });
  return obj;
}

function buildPayload(pipeline) {
  let order = 1;
  const out = {};
  CAT_ORDER.forEach((cat) => {
    out[cat] = (pipeline[cat] || []).map((s) => ({
      name: (s.name || "").trim(),
      category: cat,
      color: s.color || null,
      order: order++,
    }));
  });
  return out;
}

function sanitizePipelineForCompare(p) {
  // buang _id supaya deep-equal senang
  const x = {};
  CAT_ORDER.forEach((k) => {
    x[k] = (p[k] || []).map(({ name, category, color }) => ({
      name,
      category,
      color: color || "",
    }));
  });
  return x;
}

function toArrayPayload(pipeline) {
    let order = 1;
    return CAT_ORDER.flatMap(cat =>
      (pipeline[cat] || []).map(s => ({
        name: (s.name || '').trim(),
        category: cat,
        color: s.color || null,
        order: order++,
      }))
    );
  }

  export default function TeamSettings({ teamId: _teamIdProp }) {
    // Dapatkan dari URL
    const params = useParams?.() || {};
    const [sp] = useSearchParams?.() || [];
  
    // ⬇️ ADD: from TeamProvider
    const { activeTeam, isLoading: teamCtxLoading } = useTeam();
  
    // ⬇️ NEW: teamId fallback — prop → /:teamId → ?teamId= → activeTeam.id
    const teamId =
      _teamIdProp ||
      params.teamId ||
      (sp ? sp.get("teamId") : null) ||
      activeTeam?.id;
  
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");
  
    const [team, setTeam] = React.useState(null);
    const [teamName, setTeamName] = React.useState("");
    const [pipeline, setPipeline] = React.useState(emptyPipeline());
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
  
    // --- load
    React.useEffect(() => {
      // ⬇️ Tunggu context selesai, then decide
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
          // Try GET team (abaikan 404 jika route tak wujud)
          let t = null;
          try {
            const tRes = await toolsApi.get(`/api/salestrack/teams/${teamId}`, { timeout: 15000 });
            t = tRes.data;
            if (!alive) return;
            setTeam(t);
            setTeamName(t?.name || "");
          } catch (e) {
            if (e?.response?.status !== 404) throw e;
            // route tak ada → biar nama kosong/last known
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
      // ⬇️ reload bila activeTeam.id berubah
    }, [teamId, teamCtxLoading]);
  
    // --- actions (unchanged, but kept here for completeness)
    const saveAll = async () => {
      setSaving(true);
      setError("");
      try {
        if ((team?.name || "") !== (teamName || "").trim()) {
          try {
            await toolsApi.put(`/api/salestrack/teams/${teamId}`, { name: teamName.trim() }, { timeout: 15000 });
          } catch (e) {
            if (e?.response?.status !== 404) throw e;
          }
        }
        const body = buildPayload(pipeline);
        await toolsApi.post(`/api/salestrack/teams/${teamId}/statuses`, body, { timeout: 20000 });
        setInitialSnapshot({
          name: (teamName || "").trim(),
          pipeline: sanitizePipelineForCompare(pipeline),
        });
      } catch (e) {
        console.error("[TeamSettings] save failed:", e);
        setError(e?.response?.data?.error || "Failed to save settings.");
      } finally {
        setSaving(false);
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
  
    // --- render
    if (teamCtxLoading) {
      return (
        <div className="p-6">
          <p className="text-slate-600">Loading teams…</p>
        </div>
      );
    }
  
    if (!teamId) {
      return (
        <div className="p-6">
          <p className="text-slate-600">Please select a team.</p>
        </div>
      );
    }
  
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Team Settings</h1>
          <div className="text-sm text-slate-500">
            Team ID: <span className="font-mono">{teamId}</span>
          </div>
        </div>
  
        {loading ? (
          <div className="rounded-md border p-6">Loading…</div>
        ) : (
          <>
            {/* Team name */}
            <section className="rounded-md border p-6 mb-6 bg-white">
              <h2 className="text-lg font-semibold">Team</h2>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  placeholder="Enter team name"
                />
              </div>
            </section>
  
            {/* Pipeline */}
            <section className="rounded-md border p-6 bg-white">
              <h2 className="text-lg font-semibold">Sales Pipeline</h2>
              <p className="text-slate-500 text-sm mt-1">Edit, choose colour and order of team statuses.</p>
  
              <div className="mt-6 space-y-8">
                <StageEditor stageKey="Prospect" title="Prospect / Lead" note="Early stage." statuses={pipeline.Prospect} onUpdate={onUpdateStage} />
                <StageEditor stageKey="Deal" title="Deal" note="Negotiation/offer." statuses={pipeline.Deal} onUpdate={onUpdateStage} />
                <StageEditor stageKey="Outcome" title="Outcome" note="Result stage." statuses={pipeline.Outcome} onUpdate={onUpdateStage} />
                <StageEditor stageKey="Ongoing" title="Ongoing" note="Post-sales / retention." statuses={pipeline.Ongoing} onUpdate={onUpdateStage} />
              </div>
  
              <div className="mt-8 flex items-center justify-end gap-3 border-t pt-4">
                <button type="button" onClick={resetFromServer} className="rounded-md border px-4 py-2 text-slate-700" disabled={saving} title="Reload from server">
                  Reset
                </button>
                <button type="button" onClick={saveAll} disabled={saving || !hasChanges} className="rounded-md bg-slate-900 px-4 py-2 text-white font-semibold disabled:opacity-50">
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </section>
  
            {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}
          </>
        )}
      </div>
    );
  }
