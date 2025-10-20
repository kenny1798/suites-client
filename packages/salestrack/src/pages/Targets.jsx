// packages/salestrack/src/pages/Targets.jsx
import React, { useEffect, useState } from 'react';
import { useTeam } from '@suite/core-context';
import { toolsApi } from '@suite/api-clients';

const money = (c=0)=>`RM${(Number(c||0)/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const parseRM = (s='') => Math.round(Number(String(s).replace(/[^\d.]/g,'')) * 100);
const pad2 = (n)=>String(n).padStart(2,'0');
function todayMY(){ const d=new Date(); return { y:d.getFullYear(), m:d.getMonth()+1 }; }

export default function Targets(){
  const { activeTeam } = useTeam();
  const teamId = activeTeam?.id;

  const { y, m } = todayMY();
  const [month, setMonth] = useState(m);
  const [year, setYear]   = useState(y);
  const [q, setQ]         = useState('');

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [role, setRole] = useState(null);
  const [sections, setSections] = useState([]); // [{key,title,rows:[...]}]

  async function load(){
    if (!teamId) return;
    setLoading(true);
    try{
      const res = await toolsApi.get(`/api/salestrack/teams/${teamId}/targets/role-view`, {
        params: { month, year, q }
      });
      setRole(res.data?.role);
      setSections(res.data?.sections || []);
      setErr(null);
    }catch(e){
      console.error(e);
      setErr(e?.response?.data?.error || 'Failed to load targets.');
    }finally{
      setLoading(false);
    }
  }
  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [teamId, month, year, q]);

  if (!teamId) return <div className="p-6 text-gray-500">No team selected.</div>;

  return (
    <div className="p-6 space-y-4">
      {/* filters */}
      <div>
        <h1 className="text-xl font-semibold">Targets</h1>
        <p className="text-sm text-gray-500">Set, monitor, and hit your sales goals</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select className="border rounded px-3 py-1.5" value={month} onChange={e=>setMonth(Number(e.target.value))}>
          {Array.from({length:12},(_,i)=>i+1).map(mm=> <option key={mm} value={mm}>{pad2(mm)}</option>)}
        </select>
        <select className="border rounded px-3 py-1.5" value={year} onChange={e=>setYear(Number(e.target.value))}>
          {[y-1,y,y+1,y+2].map(yy=> <option key={yy} value={yy}>{yy}</option>)}
        </select>
        {/* owner/admin & manager boleh cari; sales rep pun boleh, tak memudaratkan */}
        <input className="ml-2 border rounded px-3 py-1.5 w-64" placeholder="Search name/email" value={q} onChange={e=>setQ(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : err ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-800">{err}</div>
      ) : (
        sections.map(sec => <Section key={sec.key} section={sec} teamId={teamId} month={month} year={year} onSaved={load} />)
      )}
    </div>
  );
}

function Section({ section, teamId, month, year, onSaved }) {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold">{section.title}</h2>
      <div className="overflow-x-auto bg-white border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr><Th>User</Th><Th>Email</Th><Th>Target (RM)</Th><Th>Units</Th><Th>Action</Th></tr>
          </thead>
          <tbody>
            {section.rows.map((r,i)=><Row key={`${section.key}-${r.userId}-${i}`} row={r} canEdit={r.canEdit} teamId={teamId} month={month} year={year} onSaved={onSaved} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ row, canEdit, teamId, month, year, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [rm, setRM] = useState(((row?.targetValue||0)/100).toFixed(2));
  const [units, setUnits] = useState(row?.targetUnits || 0);
  const saving = false;

  async function save() {
    try{
      await toolsApi.put(`/api/salestrack/teams/${teamId}/targets/me`, {
        month, year, targetValue: parseRM(rm), targetUnits: Number(units||0)
      });
      setEditing(false);
      onSaved?.();
    }catch(e){
      console.error(e);
      alert(e?.response?.data?.error || 'Failed to save.');
    }
  }

  return (
    <tr className="border-t">
      <Td>{row.user?.name || `User #${row.userId}`}</Td>
      <Td>{row.user?.email || '—'}</Td>
      <Td>
        {editing ? (
          <input className="border rounded px-2 py-1 w-28" value={rm} onChange={e=>setRM(e.target.value)} />
        ) : money(row.targetValue)}
      </Td>
      <Td>
        {editing ? (
          <input type="number" className="border rounded px-2 py-1 w-24" value={units} onChange={e=>setUnits(e.target.value)} />
        ) : (row.targetUnits || 0)}
      </Td>
      <Td className="space-x-2">
        {canEdit ? (
          editing ? (
            <>
              <button className="px-2 mx-2 py-1 border rounded" onClick={()=>setEditing(false)}>Cancel</button>
              <button className="px-2 py-1 rounded text-white bg-emerald-600" onClick={save} disabled={saving}>Save</button>
            </>
          ) : (
            <button className="px-2 py-1 border rounded" onClick={()=>setEditing(true)}>Edit</button>
          )
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </Td>
    </tr>
  );
}

/* atoms */
function Th({ children }){ return <th className="text-left p-2 border-b font-medium text-gray-600">{children}</th>; }
function Td({ children }){ return <td className="p-2">{children}</td>; }
