// salestrack/src/pages/OpportunitiesContent.jsx
import { useEffect, useState } from 'react';
import { toolsApi } from '@suite/api-clients';

export default function OpportunitiesContent({ teamId, onOpen }) {
  const [items, setItems] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [ops, sts] = await Promise.all([
        toolsApi.get('/api/salestrack/opportunities', { params: { teamId } }),
        toolsApi.get(`/api/salestrack/teams/${teamId}/statuses`),
      ]);
      setItems(ops.data || []);
      setStatuses(sts.data || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { if (teamId) load(); }, [teamId]);

  async function moveTo(id, toStatusId) {
    await toolsApi.post(`/api/salestrack/opportunities/${id}/move`, { teamId, toStatusId });
    await load();
  }

  const filtered = items.filter(o =>
    `${o.name} ${(o.Contact?.name || o.contact?.name || '')}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Opportunities</h1>
        <input className="border rounded-lg px-3 py-1.5 text-sm w-64"
               placeholder="Search name/contact" value={q} onChange={e=>setQ(e.target.value)} />
      </header>

      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500">No opportunities yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((op) => {
            const st = op.OpportunityStatus || op.status || {};
            const contactName = op.Contact?.name || op.contact?.name || '-';
            return (
              <div key={op.id} className="border rounded-xl bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{op.name}</div>
                    <div className="text-sm text-gray-500">{contactName}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: st.color || '#eef2f7' }}>
                    {st.name || '—'}
                  </span>
                </div>

                <div className="mt-2 text-sm text-gray-600">Value: <b>RM {(op.value/100).toFixed(2)}</b></div>

                <div className="mt-3 flex items-center gap-2">
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value=""
                    onChange={e => { if (e.target.value) moveTo(op.id, Number(e.target.value)); e.target.value=''; }}
                  >
                    <option value="">Move to…</option>
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  <button
                    className="ml-auto text-blue-600 text-sm underline"
                    onClick={() => onOpen?.(op)}
                  >
                    Open
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
