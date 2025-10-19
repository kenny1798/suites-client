import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toolsApi } from '@suite/api-clients';
import { useTeam } from '@suite/core-context';
import { useAuth } from '@suite/auth';

const money = (cents = 0) => `RM ${(Number(cents) / 100).toFixed(2)}`;
const isoNow = () => new Date().toISOString();

export default function OpportunityDetail() {
  const { oppId } = useParams();
  const { activeTeam } = useTeam();
  const { user } = useAuth();
  const teamId = activeTeam?.id;
  const me = user?.id ? Number(user.id) : null;

  

  const [opp, setOpp] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [busyMove, setBusyMove] = useState(false);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const statusLut = useMemo(
    () => Object.fromEntries((statuses || []).map(s => [s.id, s.name])),
    [statuses]
  );

  const stage = useMemo(() => opp?.OpportunityStatus || opp?.status || null, [opp]);


  async function loadAll() {
    if (!teamId || !oppId) return;
    setLoading(true);
    try {
      const [opsRes, stsRes, actsRes, tasksRes, tlRes] = await Promise.all([
        toolsApi.get('/api/salestrack/opportunities', { params: { teamId } }),
        toolsApi.get(`/api/salestrack/teams/${teamId}/statuses`),
        toolsApi.get(`/api/salestrack/opportunities/${oppId}/activities`, { params: { teamId } }),
        toolsApi.get(`/api/salestrack/tasks`, { params: { teamId, scope: 'team' } }),
        toolsApi.get(`/api/salestrack/opportunities/${oppId}/timeline`, { params: { teamId } }),
      ]);
      const item = (opsRes.data || []).find(o => String(o.id) === String(oppId)) || null;

      setOpp(item);
      setStatuses(stsRes.data || []);
      setActivities(actsRes.data?.items || []);
      setTasks((tasksRes.data?.items || []).filter(t => String(t.opportunityId) === String(oppId)));
      setTimeline(tlRes.data?.items || []);
      setErr(null);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to load opportunity.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [teamId, oppId]);

  async function move(toStatusId) {
    if (!toStatusId || toStatusId === stage?.id) return;
    try {
      setBusyMove(true);
      await toolsApi.post(`/api/salestrack/opportunities/${oppId}/move`, { teamId, toStatusId });
      await loadAll();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to move stage.');
    } finally {
      setBusyMove(false);
    }
  }

  if (loading) return <div className="p-4 md:p-6 text-gray-500">Loading opportunity…</div>;
  if (err || !opp) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          {err || 'Not found.'}
        </div>
      </div>
    );
  }

  const contactName = opp.Contact?.name || opp.contact?.name || '-';

  console.log(timeline)

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-semibold truncate">{opp.name}</h1>
          <p className="text-sm text-gray-600 truncate">{contactName}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className="inline-flex shrink-0 items-center rounded-full px-2 py-1 text-xs font-medium"
              style={{ background: stage?.color || '#eef2f7' }}
            >
              {stage?.name || '—'}
            </span>
            <div className="text-right">
              <div className="text-[11px] text-gray-500">Value</div>
              <div className="text-sm md:text-base font-semibold">{money(opp.value)}</div>
            </div>
          </div>

          {/* Controlled select */}
          <select
            disabled={busyMove}
            className="w-full sm:w-auto border rounded-lg px-3 py-2 text-sm"
            value={stage?.id || ''}
            onChange={(e) => move(Number(e.target.value))}
          >
            <option value="" disabled>Move stage…</option>
            {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </header>

      {/* Grid: 1 col on mobile, 3 cols from md */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6">
        {/* LEFT 2 cols */}
        <div className="xl:col-span-2 space-y-4 xl:space-y-6">
          <section className="rounded-xl border bg-white p-4 md:p-5">
            <h2 className="text-sm font-semibold mb-3">Log Activity</h2>
            <ActivityForm
              onSubmit={async (payload) => {
                await toolsApi.post(`/api/salestrack/opportunities/${oppId}/activities`, { teamId, ...payload });
                await loadAll();
              }}
            />
            <div className="mt-3 md:mt-4">
              <ActivityList items={activities} />
            </div>
          </section>

          <section className="rounded-xl border bg-white p-4 md:p-5">
            <h2 className="text-sm font-semibold mb-3">Follow-up Tasks</h2>
            <TaskQuickAdd
              defaultDueHours={24}
              onSubmit={async ({ note, dueAt, type }) => {
                     const payload = {
                         teamId,
                         type: type || 'FOLLOWUP',
                         note,
                         dueAt,
                       };
                       if (Number.isFinite(me)) payload.assigneeId = me;
                  
                       await toolsApi.post(
                         `/api/salestrack/opportunities/${oppId}/tasks`,
                         payload
                       );
                        await loadAll();
                      }}
            />
            <div className="mt-3 md:mt-4">
              <TaskList
                items={tasks}
                onAction={async (id, action) => {
                  if (action === 'done') {
                    await toolsApi.patch(`/api/salestrack/tasks/${id}`, { teamId, status: 'DONE', completedAt: isoNow() });
                  } else if (action === 'snooze') {
                    const dt = new Date(Date.now() + 24 * 3600e3).toISOString();
                    await toolsApi.patch(`/api/salestrack/tasks/${id}`, { teamId, status: 'SNOOZED', snoozeUntil: dt });
                  } else if (action === 'cancel') {
                    await toolsApi.patch(`/api/salestrack/tasks/${id}`, { teamId, status: 'CANCELLED' });
                  }
                  await loadAll();
                }}
              />
            </div>
          </section>
        </div>

        {/* RIGHT: timeline */}
        <div className="space-y-4 md:space-y-6">
          <section className="rounded-xl border bg-white p-4 md:p-5">
            <h2 className="text-sm font-semibold mb-3">Timeline</h2>
            <Timeline items={timeline} statusLut={statusLut} />
          </section>
        </div>
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function ActivityForm({ onSubmit }) {
  const [type, setType] = useState('WHATSAPP');
  const [status, setStatus] = useState('COMPLETED');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        type, status, notes,
        completedAt: status === 'COMPLETED' ? isoNow() : null
      });
      setNotes('');
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
      <select value={type} onChange={e => setType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
        {['WHATSAPP','CALL','EMAIL','MEETING','DEMO'].map(x => <option key={x} value={x}>{x}</option>)}
      </select>
      <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
        {['COMPLETED','PLANNED','CANCELLED'].map(x => <option key={x} value={x}>{x}</option>)}
      </select>
      <input
        className="border rounded-lg px-3 py-2 text-sm sm:col-span-2"
        placeholder="Notes / outcome"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />
      <button
        disabled={loading}
        className="sm:col-span-4 w-full bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-black disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Log Activity'}
      </button>
    </form>
  );
}

function ActivityList({ items }) {
  if (!items?.length) return <div className="text-sm text-gray-500">No activity yet.</div>;
  return (
    <ul className="text-sm text-gray-800 divide-y">
      {items.map(a => (
        <li key={a.id} className="py-2 grid grid-cols-1 md:grid-cols-[auto,1fr,auto] items-start gap-1 md:gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100">{a.type}</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100">{a.status}</span>
          </div>
          <span className="min-w-0 break-words whitespace-normal">{a.outcome || a.notes || ''}</span>
          <span className="text-gray-500 text-xs md:text-sm md:text-right">{fmtDate(a.completedAt || a.scheduledAt || a.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}

function TaskQuickAdd({ defaultDueHours = 24, onSubmit }) {
  const [note, setNote] = useState('');
  const [type, setType] = useState('FOLLOWUP');
  const [dueLocal, setDueLocal] = useState(() => toLocalInput(new Date(Date.now() + defaultDueHours * 3600e3)));
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ note, type, dueAt: new Date(dueLocal).toISOString() });
      setNote('');
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
      <select value={type} onChange={e => setType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
        {['FOLLOWUP','CALL','EMAIL','MEETING','WHATSAPP'].map(x => <option key={x} value={x}>{x}</option>)}
      </select>
      <input
        className="border rounded-lg px-3 py-2 text-sm sm:col-span-2"
        placeholder="Follow-up note"
        value={note}
        onChange={e => setNote(e.target.value)}
      />
      <input
        type="datetime-local"
        className="border rounded-lg px-3 py-2 text-sm"
        value={dueLocal}
        onChange={e => setDueLocal(e.target.value)}
      />
      <button
        disabled={loading}
        className="sm:col-span-4 w-full bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-black disabled:opacity-50"
      >
        {loading ? 'Adding…' : 'Add Task'}
      </button>
    </form>
  );
}

function TaskList({ items, onAction }) {
  if (!items?.length) return <div className="text-sm text-gray-500">No tasks yet.</div>;
  return (
    <ul className="divide-y">
      {items.map(t => (
        <li key={t.id} className="py-2 grid grid-cols-1 md:grid-cols-[auto,1fr,auto] items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100">{t.type}</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100">{t.status}</span>
          </div>
          <span className="min-w-0 break-words whitespace-normal">{t.note || ''}</span>
          <div className="flex items-center gap-2 md:justify-end">
            <span className="text-gray-500 text-sm">{fmtDate(t.dueAt)}</span>
            <div className="flex gap-1">
              <button onClick={() => onAction(t.id, 'done')} className="text-emerald-700 text-xs px-2 py-1 rounded border border-emerald-200">Done</button>
              <button onClick={() => onAction(t.id, 'snooze')} className="text-amber-700 text-xs px-2 py-1 rounded border border-amber-200">Snooze</button>
              <button onClick={() => onAction(t.id, 'cancel')} className="text-gray-700 text-xs px-2 py-1 rounded border">Cancel</button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Timeline({ items, statusLut }) {
    if (!items?.length) return <div className="text-sm text-gray-500">No timeline yet.</div>;
    return (
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="rounded-lg border border-gray-100 bg-white p-3">
            {/* Header: badge kiri, tarikh kanan */}
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-[11px] px-2 py-0.5 rounded bg-gray-100">
                {it.kind}
              </span>
              <span className="shrink-0 text-xs text-gray-500">
                {fmtDate(it.at)}
              </span>
            </div>
  
            {/* Description (wrap elok) */}
            <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap break-words">
              {renderTL(it, statusLut)}
            </div>
          </li>
        ))}
      </ul>
    );
  }
  
  function renderTL(it, statusLut = {}) {
    // Server hantar `data.details` — fallback ke root kalau tiada
    const d = it.data || {};
    const det = d.details || d;   // <-- penting
  
    switch (it.kind) {
      case 'STATUS_CHANGE': {
        // Cuba guna nama direct; kalau tiada, fallback guna LUT id->name
        const fromName = det?.from?.name || statusLut[det?.fromStatusId] || '—';
        const toName   = det?.to?.name   || statusLut[det?.toStatusId]   || '—';
        return `Stage: ${fromName} → ${toName}`;
      }
  
      case 'OPP_CREATED': {
        const nm = det?.name || det?.opportunityName || '';
        const by = det?.createdBy || det?.userName || det?.by || '';
        return `Deal created${nm ? `: "${nm}"` : ''}${by ? ` by ${by}` : ''}`;
      }
  
      case 'ACTIVITY': {
        const base = `Activity ${d.type || det.type || ''}`.trim();
        const note = det.outcome ?? det.notes;
        return note ? `${base} — ${note}` : base;
      }
  
      case 'TASK':
        return `Task ${det.type || ''} • ${det.status || ''}${det.dueAt ? ` • due ${fmtDate(det.dueAt)}` : ''}`.trim();
  
      case 'FOLLOWUP_ATTEMPT':
        return `Follow-up attempt${det.cause ? ` (${det.cause})` : ''}`;
  
      case 'NOTE':
        return det.note || det.content || det.text || 'Note added';
  
      default:
        return it.kind;
    }
  }
  
  

function fmtDate(s) {
  const dt = s ? new Date(s) : null;
  return dt ? dt.toLocaleString() : '-';
}
function toLocalInput(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
