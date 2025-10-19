import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTeam } from '@suite/core-context';
import { useAuth } from '@suite/auth';
import { toolsApi } from '@suite/api-clients';
import Select from 'react-select';

const isoNow = () => new Date().toISOString();
const toLocalInput = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fmtDate = (s) => (s ? new Date(s).toLocaleString() : '—');
const cls = (...xs) => xs.filter(Boolean).join(' ');

export default function TasksPage() {
  const { activeTeam } = useTeam();
  const { user } = useAuth();
  const teamId = activeTeam?.id;
  const me = user?.id ? Number(user.id) : null;

  const [items, setItems] = useState([]);
  const [opps, setOpps] = useState([]);               // ← list opportunities
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // controls
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('OPEN');       // OPEN | SNOOZED | DONE | CANCELLED | OVERDUE | ALL
  const [type, setType] = useState('ALL');
  const [mineOnly, setMineOnly] = useState(false);

  // quick add
  const [qaOpen, setQaOpen] = useState(false);
  const [qa, setQa] = useState({
    type: 'FOLLOWUP',
    note: '',
    dueLocal: toLocalInput(new Date(Date.now() + 24 * 3600e3)),
    opportunityId: '',                             
  });
  const [qaBusy, setQaBusy] = useState(false);

  async function load() {
    if (!teamId) return;
    setLoading(true);
    try {
      const params = { teamId, scope: mineOnly ? 'mine' : 'team' };
      if (status !== 'ALL') params.status = status;
      if (type   !== 'ALL') params.type   = type;
  
      const res = await toolsApi.get('/api/salestrack/tasks/filter', { params });
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
      setErr(null);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to fetch tasks.');
    } finally { setLoading(false); }
  }
  
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [teamId, mineOnly, status, type]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const qStr = q.trim().toLowerCase();
  
    return (items || [])
      .filter((t) => {
        const tStatus = String(t.status || '').toUpperCase();
        const tType   = String(t.type   || '').toUpperCase();
  
        // STATUS
        if (status !== 'ALL') {
          if (status === 'OVERDUE') {
            const isOpenish = tStatus === 'OPEN' || tStatus === 'SNOOZED';
            const dueTs = t.dueAt ? new Date(t.dueAt).getTime() : Number.POSITIVE_INFINITY;
            if (!(isOpenish && Number.isFinite(dueTs) && dueTs < now)) return false;
          } else if (tStatus !== status) {
            return false;
          }
        }
  
        // TYPE
        if (type !== 'ALL' && tType !== type) return false;
  
        // MINE ONLY
        if (mineOnly) {
          if (!me) return false; // user not loaded yet
          if (Number(t.assigneeId) !== Number(me)) return false;
        }
  
        // SEARCH
        if (!qStr) return true;
        const blob = [
          t.note,
          t.type,
          t.status,
          t?.Opportunity?.name,
          t?.Contact?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
  
        return blob.includes(qStr);
      })
      .sort((a, b) => {
        // earliest due first, then createdAt
        const ad = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
        const bd = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
        if (ad !== bd) return ad - bd;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
  }, [items, q, status, type, mineOnly, me]);

  console.log('filtered', filtered);

  // actions (gunakan PUT sebab toolsApi tak ada patch)
  async function onAction(id, action) {
    try {
      if (action === 'done') {
        await toolsApi.patch(`/api/salestrack/tasks/${id}`, { teamId, status: 'DONE', completedAt: isoNow() });
      } else if (action === 'snooze') {
        const dt = new Date(Date.now() + 24 * 3600e3).toISOString();
        await toolsApi.patch(`/api/salestrack/tasks/${id}`, { teamId, status: 'SNOOZED', snoozeUntil: dt });
      } else if (action === 'cancel') {
        await toolsApi.patch(`/api/salestrack/tasks/${id}`, { teamId, status: 'CANCELLED' });
      }
      await load();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to update task.');
    }
  }

  async function quickAdd(e) {
    e.preventDefault();
  
    const oppId = String(qa.opportunityId || '').trim();
    if (!oppId) { alert('Please select an opportunity.'); return; }
  
    setQaBusy(true);
    try {
      await toolsApi.post(`/api/salestrack/opportunities/${Number(oppId)}/tasks`, {
        teamId,
        assigneeId: me,
        type: qa.type,
        note: qa.note || '',
        dueAt: new Date(qa.dueLocal).toISOString(),
      });
      setQa((s) => ({ ...s, note: '' }));
      await load();
      setQaOpen(false);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to create task.';
      alert(msg);                    // ← sekarang keluar punca sebenar, bukan generic
      console.error('createTask error:', e?.response?.data || e);
    } finally {
      setQaBusy(false);
    }
  }
  
  

  return (
    <div className="p-6 space-y-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tasks</h1>
        <button className="px-3 py-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium bg-white hover:bg-gray-50" onClick={() => setQaOpen(v => !v)}>
          {qaOpen ? 'Close' : 'Quick Add'}
        </button>
      </div>

      {/* quick add (same layout) */}
      {qaOpen && (
        <form onSubmit={quickAdd} className="grid grid-cols-1 lg:grid-cols-4 gap-2 border rounded-xl bg-white p-3">
          <select
            value={qa.type}
            onChange={(e) => setQa((s) => ({ ...s, type: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {['FOLLOWUP','CALL','EMAIL','MEETING','WHATSAPP'].map(x => <option key={x} value={x}>{x}</option>)}
          </select>

          <input
            className="border rounded-lg px-3 py-2 text-sm lg:col-span-2"
            placeholder="Task note"
            value={qa.note}
            onChange={(e) => setQa((s) => ({ ...s, note: e.target.value }))}
          />

          <input
            type="datetime-local"
            className="border rounded-lg px-3 py-2 text-sm"
            value={qa.dueLocal}
            onChange={(e) => setQa((s) => ({ ...s, dueLocal: e.target.value }))}
          />

          {/* Wajib pilih opportunity */}
          <select
            className="border rounded-lg px-3 py-2 text-sm lg:col-span-3"
            value={qa.opportunityId}
            onChange={(e) => setQa((s) => ({ ...s, opportunityId: String(e.target.value) }))}
            required
            >
            <option value="">Select opportunity…</option>
            {opps.map(o => (
                <option key={o.id} value={String(o.id)}>
                {o.name}{o.Contact?.name ? ` — ${o.Contact.name}` : ''}
                </option>
            ))}
            </select>

            <button
                disabled={qaBusy || !qa.opportunityId}
                className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
                >
                {qaBusy ? 'Saving…' : 'Add Task'}
                </button>
        </form>
      )}

      {/* controls */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <input
          className="border rounded-lg px-3 py-2 text-sm w-full lg:w-80"
          placeholder="Search note/opportunity/contact"
          value={q} onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            {['OPEN','SNOOZED','OVERDUE','DONE','CANCELLED','ALL'].map(x => <option key={x} value={x}>{x}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            {['ALL','FOLLOWUP','CALL','EMAIL','MEETING','WHATSAPP'].map(x => <option key={x} value={x}>{x}</option>)}
          </select>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={mineOnly} onChange={(e)=>setMineOnly(e.target.checked)} />
            Mine only
          </label>
        </div>
      </div>

      {/* content */}
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : err ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-800">{err}</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500">No tasks.</div>
      ) : (
        <>
          {/* desktop */}
          <div className="hidden md:block overflow-x-auto bg-white border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Type</Th><Th>Status</Th><Th>Note</Th><Th>Due</Th><Th>Opportunity</Th><Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-t">
                    <Td><Badge>{t.type}</Badge></Td>
                    <Td><Badge>{t.status}</Badge></Td>
                    <Td className="max-w-[420px]">{t.note || '—'}</Td>
                    <Td>{fmtDate(t.dueAt)}</Td>
                    <Td>
                      {t.opportunityId ? (
                        <Link to={`/salestrack/opps/${t.opportunityId}`} className="underline">
                          {t?.Opportunity?.name || `#${t.opportunityId}`}
                        </Link>
                      ) : '—'}
                    </Td>
                    <Td className="text-right">
                       {t.status === 'CANCELLED' || t.status === 'DONE' ? '' : <Actions t={t} onAction={onAction} />} 
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile */}
          <div className="grid md:hidden gap-3">
            {filtered.map(t => (
              <div key={t.id} className="rounded-xl border bg-white p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge>{t.type}</Badge><Badge>{t.status}</Badge>
                  <div className="ml-auto text-xs text-gray-500">{fmtDate(t.dueAt)}</div>
                </div>
                <div className="text-sm">{t.note || '—'}</div>
                <div className="text-xs">
                  {t.opportunityId ? (
                    <Link to={`/salestrack/opps/${t.opportunityId}`} className="underline">
                      {t?.Opportunity?.name || `#${t.opportunityId}`}
                    </Link>
                  ) : 'No opportunity'}
                </div>
                <div className="pt-1"><Actions t={t} onAction={onAction} /></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Th({ children, className }) {
  return <th className={cls('text-left p-2 border-b font-medium text-gray-600', className)}>{children}</th>;
}
function Td({ children, className }) {
  return <td className={cls('p-2 align-top', className)}>{children}</td>;
}
function Badge({ children }) {
  return <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100">{children}</span>;
}

function BadgeDanger({ children }) {
    return <span className="text-[11px] px-2 py-0.5 rounded bg-red-100">{children}</span>;
  }
function Actions({ t, onAction }) {
  return (
    <div className="flex flex-wrap gap-1 justify-end">
      <button onClick={()=>onAction(t.id,'done')}
              className="text-emerald-700 text-xs px-2 py-1 rounded border border-emerald-200">Done</button>
      <button onClick={()=>onAction(t.id,'snooze')}
              className="text-amber-700 text-xs px-2 py-1 rounded border border-amber-200">Snooze</button>
      <button onClick={()=>onAction(t.id,'cancel')}
              className="text-gray-700 text-xs px-2 py-1 rounded border">Cancel</button>
    </div>
  );
}
