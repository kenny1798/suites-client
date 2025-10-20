// packages/salestrack/src/pages/OpportunityDetail.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toolsApi } from '@suite/api-clients';
import { useTeam } from '@suite/core-context';
import { useAuth } from '@suite/auth';
import { getContrastingTextColor } from '../utils/color.js';
import { combinePhone } from '../utils/combinePhone.js';
import { ConfirmDialog } from '@suite/ui';

const moneyFmt = (cents = 0) => `RM ${(Number(cents) / 100).toFixed(2)}`;
const toCents = (rmString) => Math.round(Number((rmString || '0').toString().replace(/[^\d.]/g, '')) * 100);
const isoNow = () => new Date().toISOString();

export default function OpportunityDetail() {
  const { oppId } = useParams();
  const navigate = useNavigate();
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
  const [busySave, setBusySave] = useState(false);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  // inline edit states
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');

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
      setEditName(item?.name || '');
      setEditValue(item ? moneyFmt(item.value) : '');
      setStatuses(stsRes.data || []);
      setActivities(actsRes.data?.items || []);
      setTasks((tasksRes.data?.items || []).filter(t => String(t.opportunityId) === String(oppId)));
      setTimeline(tlRes.data?.items || []);
      setErr(null);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to load opportunity.');
    } finally { setLoading(false); }
  }
  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [teamId, oppId]);

  // 3) move with confirmation (show from -> to)
  async function move(toStatusId) {
    if (!toStatusId || toStatusId === stage?.id) return;
    const fromName = stage?.name || '—';
    const toName = statuses.find(s => s.id === Number(toStatusId))?.name || '—';
    const ok = await askConfirm({
      title: 'Move stage?',
      message: `From: ${fromName}\nTo:   ${toName}`,
      confirmText: 'Move',
    });
    if (!ok) return;
    try {
      setBusyMove(true);
      await toolsApi.post(`/api/salestrack/opportunities/${oppId}/move`, { teamId, toStatusId });
      await loadAll();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to move stage.');
    } finally { setBusyMove(false); }
  }

  // 4) inline save name & value
  async function savePatch(patch) {
    try {
      setBusySave(true);
      await toolsApi.put(`/api/salestrack/opportunities/${oppId}`, { teamId, ...patch });
      await loadAll();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to save.');
    } finally { setBusySave(false); }
  }

    // ---- confirm modal state ----
    const [confirm, setConfirm] = useState({
      open: false, title: '', message: '', resolve: null,
      confirmText: 'Confirm', cancelText: 'Cancel',
    });
  
    function askConfirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) {
      return new Promise((resolve) => {
        setConfirm({ open: true, title, message, confirmText, cancelText, resolve });
      });
    }
    const handleConfirmOk = () => { confirm.resolve?.(true); setConfirm(c => ({ ...c, open:false })); };
    const handleConfirmCancel = () => { confirm.resolve?.(false); setConfirm(c => ({ ...c, open:false })); };
    

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
  const { display: phoneDisplay, digits: phoneDigits } = combinePhone(opp?.Contact?.phonecc, opp?.Contact?.phone);
  const pillBg = stage?.color || '#eef2f7';
  const pillFg = getContrastingTextColor(pillBg);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
    {/* Back button (top-left) */}
    <div>
      <button
        onClick={() => {
          // fallback ke list kalau tak ada history untuk kembali
          if (window.history.length > 1) navigate(-1);
          else navigate('/salestrack/opportunities');
        }}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm bg-white hover:bg-gray-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>
    </div>

      {/* Header */}
      <header className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          {/* 4) editable name */}
          <input
            className="w-full bg-transparent text-lg md:text-xl font-semibold truncate focus:outline-none"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={() => editName !== opp.name && savePatch({ name: editName })}
          />
          <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
            <span className="truncate">{contactName}</span>
            {/* 6–7) phone under contact + WA/call */}
            {phoneDisplay && (
              <span className="flex items-center gap-1 text-gray-500">
                •
                📱
                <a href={`tel:${phoneDigits}`} className="hover:underline">{phoneDisplay}</a>
                <a
                  href={`https://wa.me/${phoneDigits}`}
                  target="_blank" rel="noreferrer"
                  className="ml-2 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-green-700 border-green-200 hover:bg-green-50"
                  title="Open WhatsApp"
                >
                  <svg viewBox="0 0 32 32" className="h-3.5 w-3.5"><path fill="currentColor" d="M19.1 17.6c-.3-.1-1.8-.9-2.1-1s-.5-.1-.7.1s-.8 1-1 1.2s-.4.2-.7.1a7.7 7.7 0 0 1-2.3-1.4a8.6 8.6 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5s0-.4 0-.5l-.7-1.7c-.2-.5-.4-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4a3.5 3.5 0 0 0-1.1 2.6a6.1 6.1 0 0 0 1.3 3.2a13.8 13.8 0 0 0 5.4 4.6a9.3 9.3 0 0 0 2.1.8a5.1 5.1 0 0 0 2.3.1a3.9 3.9 0 0 0 2.6-1.8a3.2 3.2 0 0 0 .3-1.8c0-.3-.2-.4-.4-.5z"/><path fill="currentColor" d="M26.6 5.4a13 13 0 0 0-20 15.5L5 27l6.3-1.7a13 13 0 0 0 6.2 1.6h.1a13 13 0 0 0 9-22.5zm-9 21.1h-.1a10.7 10.7 0 0 1-5.5-1.5l-.4-.2l-3.7 1l1-3.6l-.2-.4A10.7 10.7 0 1 1 27.3 16a10.7 10.7 0 0 1-9.7 10.5z"/></svg>
                  WhatsApp
                </a>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 1) status pill with contrast text */}
            <span
              className="inline-flex shrink-0 items-center rounded-full px-2 py-1 text-xs font-medium"
              style={{ background: pillBg, color: pillFg }}
            >
              {stage?.name || '—'}
            </span>

            {/* editable value */}
            <div className="text-right">
              <div className="text-[11px] text-gray-500">Value</div>
              <input
                className="text-sm md:text-base font-semibold text-right bg-transparent focus:outline-none"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={() => {
                  const cents = toCents(editValue);
                  if (cents !== Number(opp.value)) savePatch({ value: cents });
                }}
              />
              {busySave && <div className="text-[10px] text-gray-400">saving…</div>}
            </div>
          </div>

          {/* 3) Controlled select with confirm */}
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6">
        {/* LEFT */}
        <div className="xl:col-span-2 space-y-4 xl:space-y-6">
          {/* 5) cleaner Log Activity */}
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
                const payload = { teamId, type: type || 'FOLLOWUP', note, dueAt };
                if (Number.isFinite(me)) payload.assigneeId = me;
                await toolsApi.post(`/api/salestrack/opportunities/${oppId}/tasks`, payload);
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

        {/* RIGHT: timeline (2) deletable with confirm */}
        <div className="space-y-4 md:space-y-6">
          <section className="rounded-xl border bg-white p-4 md:p-5">
            <h2 className="text-sm font-semibold mb-3">Timeline</h2>
            <Timeline
              items={timeline}
              statusLut={statusLut}
              onDelete={async (it) => {
                const itemId = it.id ?? it.data?.id ?? it.dataId;
                if (!itemId) {
                  alert('Cannot delete: missing item id.');
                  return;
                }
             
                const ok = await askConfirm({
                  title: 'Delete timeline item?',
                  message: renderTL(it, statusLut),
                  confirmText: 'Delete',
                });
                if (!ok) return;
                await toolsApi.delete(
                  `/api/salestrack/opportunities/${oppId}/timeline/${it.kind}/${itemId}`,
                  { data: { teamId } }
                );             
                await loadAll();
              }}
            />
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        onConfirm={handleConfirmOk}
        onCancel={handleConfirmCancel}
      />

    </div>
  
  );
}

/* ---------- Subcomponents (same as before, small tweaks) ---------- */

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
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-2">
      <select value={type} onChange={e => setType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
        {['WHATSAPP','CALL','EMAIL','MEETING','DEMO'].map(x => <option key={x} value={x}>{x}</option>)}
      </select>
      <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
        {['COMPLETED','PLANNED','CANCELLED'].map(x => <option key={x} value={x}>{x}</option>)}
      </select>
      <input
        className="border rounded-lg px-3 py-2 text-sm md:col-span-2"
        placeholder="Notes / outcome"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />
      <button
        disabled={loading}
        className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-black disabled:opacity-50"
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
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-2">
      <select value={type} onChange={e => setType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
        {['FOLLOWUP','CALL','EMAIL','MEETING','WHATSAPP'].map(x => <option key={x} value={x}>{x}</option>)}
      </select>
      <input
        type="datetime-local"
        className="border rounded-lg px-3 py-2 text-sm"
        value={dueLocal}
        onChange={e => setDueLocal(e.target.value)}
      />
      <input
        className="border rounded-lg px-3 py-2 text-sm md:col-span-2"
        placeholder="Follow-up note"
        value={note}
        onChange={e => setNote(e.target.value)}
      />
      <button
        disabled={loading}
        className="w-full bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-black disabled:opacity-50"
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

/* 2) Timeline with delete */
function Timeline({ items, statusLut, onDelete }) {
  if (!items?.length) return <div className="text-sm text-gray-500">No timeline yet.</div>;
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.id} className="rounded-lg border border-gray-100 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="shrink-0 text-[11px] px-2 py-0.5 rounded bg-gray-100">
              {it.kind}
            </span>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs text-gray-500">{fmtDate(it.at)}</span>
              <button
                onClick={() => onDelete?.(it)}
                className="h-7 w-7 inline-flex items-center justify-center rounded border hover:bg-red-50 text-gray-500 hover:text-red-600"
                title="Delete"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M9 6V4h6v2m-8 0h10l-1 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
          <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap break-words">
            {renderTL(it, statusLut)}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function renderTL(it, statusLut = {}) {
  const d = it.data || {};
  const det = d.details || d;
  switch (it.kind) {
    case 'STATUS_CHANGE': {
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

/* ---- helpers ---- */
function fmtDate(s) { const dt = s ? new Date(s) : null; return dt ? dt.toLocaleString() : '-'; }
function toLocalInput(d) {
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
