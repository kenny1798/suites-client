// packages/salestrack/src/pages/ManagerPerformance.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useTeam } from '@suite/core-context';
import { useAuth } from '@suite/auth';
import { toolsApi } from '@suite/api-clients';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const money = (cents = 0) =>
  `RM${(Number(cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// helpers (ganti yang lama)
export function todayStr() {
    const d = new Date();                  // local time
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;             // 'YYYY-MM-DD' (local)
  }
  
  export function addDays(ymd, n) {
    // ymd = 'YYYY-MM-DD' (local)
    const [y, m, d] = ymd.split('-').map(Number);
    const dt = new Date(y, m - 1, d);      // construct in local zone
    dt.setDate(dt.getDate() + n);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }

  const labelFmt = (iso) => {
    // "2025-09-01" -> "Mon, 01 Sep 2025"
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
  };   

const cls = (...xs)=>xs.filter(Boolean).join(' ');
const pct = (n=0,d=0)=> d ? `${Math.round((Number(n)/Number(d))*100)}%` : '0%';

export default function ManagerPerformance() {
  const { activeTeam } = useTeam();
  const { user } = useAuth();
  const teamId = activeTeam?.id;
  const managerId = user?.id;

  // range
  const [from, setFrom] = useState(()=> todayStr().slice(0,7) + '-01');
  const [to, setTo]     = useState(()=> todayStr());

  // ui
  const [tab, setTab] = useState('summary'); // summary | sheet | graph | conversions
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // rep selection
  const [reps, setReps] = useState([]); // [{id, name}]
  const [pick, setPick] = useState('team'); // 'team' OR repId (number as string)

  // data
  const [kpis, setKpis] = useState({ targetCents:0, actualCents:0, wonDeals:0, newContacts:0, oppCreated:0, scope:'team' });
  const [sheet, setSheet] = useState([]); // [{ date, targetCents, actualCents, newContacts, oppCreated }]
  const [conv, setConv] = useState(null);

  console.log(todayStr());

  // ===== fetch reps under this manager =====
  useEffect(() => {
    let mounted = true;
    async function loadReps() {
      if (!teamId || !managerId) return;
      try {
        const res = await toolsApi.get('/api/salestrack/analytics/manager/reps', {
          params: { teamId, managerId }
        });
        if (!mounted) return;
        setReps(res.data?.reps || []);
      } catch (e) {
        console.error(e);
        // don’t block page if this fails
      }
    }
    loadReps();
    return () => { mounted = false; };
  }, [teamId, managerId]);

  // ===== fetch summary + sheet + conversions =====
  async function load() {
    if (!teamId || !managerId) return;
    setLoading(true);
    try {
      const tzOffset = -new Date().getTimezoneOffset();
      const scope = pick === 'team' ? 'team' : 'rep';
      const repUserId = scope === 'rep' ? Number(pick) : undefined;

      // pilih endpoint sheet mengikut scope
     const sheetEndpoint =
       scope === 'team'
         ? '/api/salestrack/analytics/manager/sheet'
         : '/api/salestrack/analytics/manager/rep/sheet';

      const [sumRes, sheetRes, convRes] = await Promise.all([
        toolsApi.get('/api/salestrack/analytics/manager/summary', {
          params: { teamId, managerId, scope, repUserId, from, to, tzOffset }
        }),
        toolsApi.get(sheetEndpoint, {
                     params:
                       scope === 'team'
                         ? { teamId, managerId, from, to, tzOffset }
                         : { teamId, repUserId, from, to, tzOffset }
                   }),
        toolsApi.get('/api/salestrack/analytics/manager/conversions', {
          params: { teamId, from, to, tzOffset, repUserId }
        }),
      ]);

      setKpis(sumRes.data?.kpis || { targetCents:0, actualCents:0, wonDeals:0, newContacts:0, oppCreated:0, scope });
      setSheet(sheetRes.data?.sheet || []);
      setConv(convRes.data || null);
      setErr(null);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.error || 'Failed to load manager performance.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [teamId, managerId, from, to, pick]);

  // ===== graphs (built from sheet) =====
  const graphData = useMemo(() => {
    const rows = sheet.map(r => ({
      date: r.date,
      Actual: (r.actualCents || 0)/100,
      Target: (r.targetCents || 0)/100,
      Gap: ((r.targetCents || 0) - (r.actualCents || 0))/100,
      NewContacts: r.newContacts || 0,
      Opportunities: r.oppCreated || 0,
    }));
    return rows;
  }, [sheet]);

  const salesGap = (kpis.targetCents || 0) - (kpis.actualCents || 0);

  function pct(a=0,b=0){ return b ? Math.round((Number(a)/Number(b))*100) : 0; }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Team Performance</h1>
        <p className="text-sm text-gray-500">Analyze your team’s overall results and productivity</p>
      </div>
      {/* top controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="border rounded px-3 py-1.5"
          value={pick}
          onChange={(e)=> setPick(e.target.value)}
        >
          <option value="team">My Team (overall)</option>
          {reps.map(r => (
            <option key={r.id} value={String(r.id)}>{r.name || `User #${r.id}`}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 items-center">

        <button className="px-3 py-1.5 rounded border" onClick={() => { const t=todayStr(); setFrom(t); setTo(t); }}>Today</button>
        <button className="px-3 py-1.5 rounded border" onClick={() => { const t=todayStr(); setFrom(addDays(t,-1)); setTo(addDays(t,-1)); }}>Yesterday</button>
        <button className="px-3 py-1.5 rounded border" onClick={() => { const t=todayStr(); setFrom(addDays(t,-6)); setTo(t); }}>Last 7 days</button>
        <button className="px-3 py-1.5 rounded border" onClick={() => { const t=todayStr(); setFrom(t.slice(0,7)+'-01'); setTo(t); }}>This Month</button>

        <div className="ml-auto flex items-center gap-2">
          <input type="date" className="border rounded px-3 py-1.5" value={from} onChange={e=>setFrom(e.target.value)} />
          <span>to</span>
          <input type="date" className="border rounded px-3 py-1.5" value={to} onChange={e=>setTo(e.target.value)} />
        </div>
      </div>

      {/* tabs */}
      <div className="flex gap-4 border-b">
        {['summary','sheet','trend','conversions'].map(k => (
          <button key={k}
            onClick={()=>setTab(k)}
            className={cls('px-3 py-2 -mb-px', tab===k ? 'border-b-2 border-black font-medium' : 'text-gray-500')}>
            {k[0].toUpperCase()+k.slice(1)}
          </button>
        ))}
      </div>

      {/* content */}
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : err ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-800">{err}</div>
      ) : tab === 'summary' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Kpi title="Targeted Sales" value={money(kpis.targetCents)} />
          <Kpi title="Actual Sales"   value={money(kpis.actualCents)} />
          <Kpi title="Sales GAP (Target − Actual)"      value={money(salesGap)} valueClass={salesGap>0 ? 'text-red-500' : 'text-green-500'} />
          <Kpi title="Won Deals"      value={String(kpis.wonDeals || 0)} />
          <Kpi title="New Contacts"   value={String(kpis.newContacts || 0)} />
          <Kpi title="Opportunities"  value={String(kpis.oppCreated || 0)} />
        </div>
      ) : tab === 'sheet' ? (
        <div className="overflow-x-auto bg-white border rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr><Th>Date</Th><Th>Target (RM)</Th><Th>Actual (RM)</Th><Th>Sales Gap (RM)</Th><Th>New Contacts</Th><Th>Opportunities</Th></tr>
            </thead>
            <tbody>
              {sheet.map((r, i)=>{

              const salesGap = Number(r.targetCents || 0) - Number(r.actualCents || 0);
              const gapCls =
                    salesGap < 0 ? 'text-emerald-600'
                  : salesGap > 0 ? 'text-rose-600'
                  : '';

              return (
                <tr key={i} className="border-t">
                  <Td>{r.date}</Td>
                  <Td>{money(r.targetCents)}</Td>
                  <Td>{money(r.actualCents)}</Td>
                  <Td className={gapCls}>{money(salesGap)}</Td>
                  <Td>{r.newContacts || 0}</Td>
                  <Td>{r.oppCreated || 0}</Td>
                </tr>
              )})}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-medium border-t">
                <Td>Total</Td>
                <Td>{money(sum(sheet,'targetCents'))}</Td>
                <Td>{money(sum(sheet,'actualCents'))}</Td>
                <Td className={salesGap>0 ? 'text-rose-600' : 'text-emerald-600'}>{money(sheet.reduce((s,x)=>s+Number(x.targetCents||0)-Number(x.actualCents||0),0))}</Td>
                <Td>{sum(sheet,'newContacts')}</Td>
                <Td>{sum(sheet,'oppCreated')}</Td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : tab === 'trend' ? (
        <div className="space-y-6">
          {/* Graph 1: Target & Actual Sales */}
          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold mb-3">Target & Actual Sales</h3>
            <ChartWrap>
              <LineChart data={graphData} margin={{ top:10, right:20, bottom:0, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={rm} width={92} />
                <Tooltip formatter={(v, n) => (n.includes('Target')||n.includes('Actual') ? money(v*100) : v)} />
                <Legend />
                <Line type="monotone" dataKey="Actual" stroke="#10b981" dot={false} name="Actual Sales (RM)" />
                <Line type="monotone" dataKey="Target" stroke="#9ca3af" dot={false} name="Daily Target (RM)" />
              </LineChart>
            </ChartWrap>
          </div>

          {/* Graph 2: Sales GAP */}
          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold mb-3">Sales GAP (Target − Actual)</h3>
            <ChartWrap>
              <LineChart data={graphData} margin={{ top:10, right:20, bottom:0, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={rm} width={92} />
                <Tooltip formatter={(v) => money(v*100)} />
                <Legend />
                <Line type="monotone" dataKey="Gap" stroke="#f59e0b" dot={false} name="GAP (RM)" />
              </LineChart>
            </ChartWrap>
          </div>

          {/* Graph 3: New Contacts & Opportunities */}
          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold mb-3">New Contacts & Opportunities</h3>
            <ChartWrap>
              <BarChart data={graphData} margin={{ top:10, right:20, bottom:0, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" allowDecimals={false} width={46}/>
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="NewContacts" name="New Contacts" fill="#60A5FA"  />
                <Bar yAxisId="left" dataKey="Opportunities" name="Opportunities" fill="#34D399" />
              </BarChart>
            </ChartWrap>
            <div className="text-xs text-gray-500 mt-2">Green/grey chart = RM; bar chart = counts.</div>
          </div>
        </div>
      ) : (
        /* CONVERSIONS */
        <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
            <CardStat
                title="Prospect → Deal"
                value={`${conv?.prospectToDeal?.count || 0} (${pct(conv?.prospectToDeal?.count, conv?.prospectToDeal?.totalNewOpps)}%)`}
            />
            <CardStat
                title="Deal → Outcome"
                value={`${conv?.dealToOutcome?.count || 0} (${pct(conv?.dealToOutcome?.count, conv?.dealToOutcome?.totalDeals)}%)`}
            />
            <CardStat
                title="Win Rate"
                value={`${conv?.winRate?.countWon || 0} (${pct(conv?.winRate?.countWon, conv?.winRate?.totalNewOpps)}%)`}
            />
            </div>

            <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold mb-3">Top Stage Transitions</h3>
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                <tr><Th>From</Th><Th>To</Th><Th>Count</Th></tr>
                </thead>
                <tbody>
                {(conv?.topStageMoves || []).map((x,i)=>(
                    <tr key={i} className="border-t">
                    <Td>{x.from}</Td><Td>{x.to}</Td><Td>{x.count}</Td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>

            <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold mb-3">Category Transitions</h3>
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                <tr><Th>From</Th><Th>To</Th><Th>Count</Th></tr>
                </thead>
                <tbody>
                {(conv?.categoryMoves || []).map((x,i)=>(
                    <tr key={i} className="border-t">
                    <Td>{x.from}</Td><Td>{x.to}</Td><Td>{x.count}</Td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ title, value, strong, valueClass }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className={cls('mt-1 text-2xl tracking-tight', strong ? 'font-bold' : 'font-semibold', valueClass)}>{value}</div>
    </div>
  );
}
function Th({ children }) { return <th className="text-left p-2 border-b font-medium text-gray-600">{children}</th>; }
function Td({ children, className }) { return <td className={cls('p-2', className)}>{children}</td>; }
function sum(arr, k){ return (arr||[]).reduce((s,x)=> s + Number(x?.[k]||0), 0); }
function rm(v){ return `RM${Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`; }
function ChartWrap({ children }) {
  return (
    <div className="w-full" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}

function CardStat({ title, value }) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-gray-600">{title}</div>
        <div className="mt-1 text-2xl tracking-tight font-semibold">{value}</div>
      </div>
    );
  }
