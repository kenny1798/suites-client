// packages/salestrack/src/pages/Targets.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useTeam } from '@suite/core-context';
import { useAuth } from '@suite/auth';
import { toolsApi } from '@suite/api-clients';

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  .map((n,i)=>({v:i+1,n}));
const thisMY = () => { const d=new Date(); return {m:d.getMonth()+1,y:d.getFullYear()}; };
const moneyRM = cents => `RM${(Number(cents||0)/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;

export default function TargetsPage(){
  const { activeTeam } = useTeam();
  const { user } = useAuth();
  const teamId = activeTeam?.id;
  const me = user?.id;

  const {m:curM,y:curY} = thisMY();
  const [month,setMonth] = useState(curM);
  const [year,setYear]   = useState(curY);

  // scope controls
  const [scope, setScope] = useState('self'); // 'self' | 'manager' | 'team' | 'managerOnly' | 'rep'
  const [managerUserId, setManagerUserId] = useState('');
  const [repUserId, setRepUserId] = useState('');
  const [includeManager, setIncludeManager] = useState(false);
  const [q, setQ] = useState('');

  // selectors (for owner: list managers; for picking a rep under selected manager)
  const [managers, setManagers] = useState([]); // [{id,name}]
  const [repsUnderManager, setRepsUnderManager] = useState([]); // [{id,name}]

  const [rows,setRows] = useState([]);
  const [loading,setLoading] = useState(true);
  const [err,setErr] = useState(null);

  // load managers for owner/admin view (reuse your existing admin selectors if available)
  useEffect(() => {
    async function loadManagers(){
      if (!teamId) return;
      try {
        const res = await toolsApi.get('/api/salestrack/analytics/admin/selectors', { params:{ teamId }});
        setManagers(res.data?.managers || []);
      } catch(e) { /* non-blocking */ }
    }
    loadManagers();
  }, [teamId]);

  // when managerUserId changes, fetch reps under that manager (for owner "rep" scope UX)
  useEffect(() => {
    async function loadReps(){
      if (!teamId || !managerUserId) { setRepsUnderManager([]); return; }
      try {
        const res = await toolsApi.get('/api/salestrack/analytics/manager/reps', {
          params: { teamId, managerId: managerUserId }
        });
        setRepsUnderManager(res.data?.reps || []);
      } catch(e){ setRepsUnderManager([]); }
    }
    loadReps();
  }, [teamId, managerUserId]);

  async function load(){
    if (!teamId || !month || !year) return;
    setLoading(true);
    try {
      const params = { teamId, month, year, scope, q: q || undefined };
      if (scope === 'manager' || scope === 'managerOnly') {
        if (managerUserId) params.managerUserId = Number(managerUserId);
        if (scope === 'manager') params.includeManager = includeManager ? '1' : '0';
      }
      if (scope === 'rep' && repUserId) params.repUserId = Number(repUserId);

      const res = await toolsApi.get('/api/salestrack/targets', { params });
      setRows(res.data?.items || []);
      setErr(null);
    } catch(e) {
      setErr(e?.response?.data?.error || 'Failed to load targets.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [teamId, month, year, scope, managerUserId, repUserId, includeManager, q]);

  function onChange(r, key, val){
    setRows(rs => rs.map(x => x.userId===r.userId ? {...x, [key]: val} : x));
  }
  async function saveRow(r){
    try {
      await toolsApi.put('/api/salestrack/targets', {
        teamId, userId: r.userId, month, year,
        targetValue: Number(r.targetValue||0),
        targetUnits: Number(r.targetUnits||0),
      });
      await load();
    } catch(e){
      alert(e?.response?.data?.error || 'Failed to save target.');
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* top controls */}
      <div className="flex flex-wrap items-center gap-2">
        <select className="border rounded px-3 py-1.5" value={month} onChange={e=>setMonth(Number(e.target.value))}>
          {months.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
        </select>
        <input type="number" className="border rounded px-3 py-1.5 w-24" value={year} onChange={e=>setYear(Number(e.target.value||0))} />

        {/* Scope picker (everyone sees 'self'; managers/owners can switch;
           backend still enforces permissions) */}
        <select className="border rounded px-3 py-1.5" value={scope} onChange={e=>setScope(e.target.value)}>
          <option value="self">My Target</option>
          <option value="manager">By Manager (reps)</option>
          <option value="managerOnly">Manager’s Reps (exclude manager)</option>
          <option value="team">Whole Team</option>
          <option value="rep">Individual Rep</option>
        </select>

        {(scope==='manager' || scope==='managerOnly' || scope==='rep') && (
          <select className="border rounded px-3 py-1.5" value={managerUserId} onChange={e=>setManagerUserId(e.target.value)}>
            <option value="">Select manager…</option>
            {managers.map(m => <option key={m.id} value={String(m.id)}>{m.name || `User #${m.id}`}</option>)}
          </select>
        )}

        {scope==='manager' && (
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeManager} onChange={e=>setIncludeManager(e.target.checked)} />
            include manager
          </label>
        )}

        {scope==='rep' && (
          <select className="border rounded px-3 py-1.5" value={repUserId} onChange={e=>setRepUserId(e.target.value)} disabled={!managerUserId}>
            <option value="">Select rep…</option>
            {repsUnderManager.map(r => <option key={r.id} value={String(r.id)}>{r.name || `User #${r.id}`}</option>)}
          </select>
        )}

        {/* Search name/email (manager & owner need this; harmless for rep) */}
        <input
          className="border rounded px-3 py-1.5 ml-auto"
          placeholder="Search name or email…"
          value={q}
          onChange={e=>setQ(e.target.value)}
        />
      </div>

      {/* table */}
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : err ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-800">{err}</div>
      ) : rows.length === 0 ? (
        <div className="text-gray-500">No users found for this filter.</div>
      ) : (
        <div className="overflow-x-auto bg-white border rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th className="text-right">Target (RM)</Th>
                <Th className="text-right">Target Units</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.userId} className="border-t">
                  <Td>{r.name}</Td>
                  <Td>{r.email || '—'}</Td>
                  <Td>
                    <input
                      className="border rounded px-2 py-1 w-40 text-right"
                      type="number" step="0.01"
                      value={(Number(r.targetValue||0)/100).toFixed(2)}
                      onChange={(e)=>{
                        const v = Math.round(parseFloat(e.target.value||'0')*100);
                        onChange(r,'targetValue', Number.isFinite(v) ? v : 0);
                      }}
                    />
                  </Td>
                  <Td>
                    <input
                      className="border rounded px-2 py-1 w-32 text-right"
                      type="number"
                      value={Number(r.targetUnits||0)}
                      onChange={(e)=> onChange(r,'targetUnits', Number(e.target.value||0))}
                    />
                  </Td>
                  <Td className="text-right">
                    <button className="px-3 py-1.5 rounded border" onClick={()=>saveRow(r)}>Save</button>
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-medium border-t">
                <Td>Total</Td>
                <Td>—</Td>
                <Td className="text-right">{moneyRM(rows.reduce((s,x)=>s+Number(x.targetValue||0),0))}</Td>
                <Td className="text-right">{rows.reduce((s,x)=>s+Number(x.targetUnits||0),0)}</Td>
                <Td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, className }) {
  return <th className={['text-left p-2 border-b font-medium text-gray-600', className].filter(Boolean).join(' ')}>{children}</th>;
}
function Td({ children, className }) {
  return <td className={['p-2 align-top', className].filter(Boolean).join(' ')}>{children}</td>;
}
