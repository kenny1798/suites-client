// packages/salestrack/src/pages/PerformanceMe.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useTeam } from '@suite/core-context';
import { useAuth } from '@suite/auth';
import { toolsApi } from '@suite/api-clients';
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine
  } from 'recharts';
  

const money = (cents = 0) =>
  `RM ${(Number(cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
  
const cls = (...xs) => xs.filter(Boolean).join(' ');

/** Lightweight bars (kept from your version) */
function MiniBars({ series, max }) {
  const M = max || Math.max(1, ...series);
  return (
    <div className="flex items-end gap-1 h-32 w-full">
      {series.map((v, i) => (
        <div key={i} className="flex-1 bg-gray-100 rounded">
          <div className="bg-emerald-500 rounded" style={{ height: `${(v / M) * 100}%` }} />
        </div>
      ))}
    </div>
  );
}

export default function PerformanceMe() {
  const { activeTeam } = useTeam();
  const { user } = useAuth();
  const teamId = activeTeam?.id;
  const userId = user?.id;

  // range
  const [from, setFrom] = useState(() => todayStr().slice(0, 7) + '-01');
  const [to, setTo]     = useState(() => todayStr());

  // ui
  const [tab, setTab] = useState('summary'); // summary | sheet | graph | conversions
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // data
  const [kpis, setKpis] = useState({ targetCents:0, actualCents:0, wonDeals:0, newContacts:0, oppCreated:0 });
  const [sheet, setSheet] = useState([]); // [{date, targetCents, actualCents, newContacts, oppCreated}]

  const [conv, setConv] = useState({
    prospectToDeal: { count: 0, totalNewOpps: 0 },
    dealToOutcome:  { count: 0, totalDeals: 0 },
    winRate:        { countWon: 0, totalNewOpps: 0 },
    topStageMoves: [],
    categoryMoves: []
  });

  async function load() {
    if (!teamId || !userId) return;
    setLoading(true);
    try {
      const tzOffset = -new Date().getTimezoneOffset();
      const [sumRes, sheetRes, convRes] = await Promise.all([
        toolsApi.get('/api/salestrack/analytics/personal/summary',    { params: { teamId, userId, from, to, tzOffset } }),
        toolsApi.get('/api/salestrack/analytics/personal/sheet',      { params: { teamId, userId, from, to, tzOffset } }),
        toolsApi.get('/api/salestrack/analytics/personal/conversions',{ params: { teamId, userId, from, to } }),
      ]);
      setKpis(sumRes.data?.kpis || {});
      setSheet(sheetRes.data?.sheet || []);
      setConv(convRes.data || {});
      setErr(null);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.error || 'Failed to load performance.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [teamId, userId, from, to]);

  const salesGap = (kpis.targetCents || 0) - (kpis.actualCents || 0);

  function ratio(a=0,b=0){ if(!b) return '0%'; return Math.round((Number(a)/Number(b))*100)+'%'; }

  const chartData = useMemo(() => {
    return (sheet || []).map(r => ({
      date: r.date,                               // YYYY-MM-DD
      target: (Number(r.targetCents || 0) / 100), // RM
      actual: (Number(r.actualCents || 0) / 100), // RM
      contacts: Number(r.newContacts || 0),
      opps: Number(r.oppCreated || 0),
    }));
  }, [sheet]);

  // ===== Export Sheet to Excel (CSV) =====
  const handleExportSheet = () => {
    if (!sheet || sheet.length === 0) {
      window.alert('No data to export for this range.');
      return;
    }

    const scopeLabel =
      user?.name
        ? `me-${user.name}`
        : userId
        ? `user-${userId}`
        : 'me';

    exportSheetToCsv({ sheet, from, to, scopeLabel });
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">My Performance</h1>
        <p className="text-sm text-gray-500">View your personal progress and achievements</p>
      </div>
      {/* range presets */}
      <div className="flex flex-wrap items-center gap-2">
        <button className="px-3 py-1.5 rounded border" onClick={() => { const t=todayStr(); setFrom(t); setTo(t); }}>Today</button>
        <button className="px-3 py-1.5 rounded border" onClick={() => { const t=todayStr(); setFrom(addDays(t,-1)); setTo(addDays(t,-1)); }}>Yesterday</button>
        <button className="px-3 py-1.5 rounded border" onClick={() => { const t=todayStr(); setFrom(addDays(t,-6)); setTo(t); }}>Last 7 days</button>
        <button className="px-3 py-1.5 rounded border" onClick={() => { const t=todayStr(); setFrom(t.slice(0,7)+'-01'); setTo(t); }}>This Month</button>
        <div className="ml-auto flex items-center gap-2">
          <input type="date" className="border rounded-lg px-3 py-1.5" value={from} onChange={e=>setFrom(e.target.value)} />
          <span>to</span>
          <input type="date" className="border rounded-lg px-3 py-1.5" value={to} onChange={e=>setTo(e.target.value)} />
        </div>
      </div>

      {/* tabs */}
      <div className="flex gap-4 border-b">
        {['summary','sheet','trend','conversions'].map(k => (
          <button key={k}
            onClick={()=>setTab(k)}
            className={cls('px-3 py-2 -mb-px', tab===k ? 'border-b-2 border-black font-medium' : 'text-gray-500')}>
            {k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>

      {/* content */}
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : err ? (
        <div className="text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">{err}</div>
      ) : tab === 'summary' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Kpi title="Targeted Sales" value={money(kpis.targetCents)} />
          <Kpi title="Actual Sales"   value={money(kpis.actualCents)} />
          <Kpi title="Sales Gap (Target − Actual)"      value={money(salesGap)} valueClass={salesGap > 0 ? 'text-red-600' : 'text-green-600'} />
          <Kpi title="Won Deals"      value={String(kpis.wonDeals || 0)} />
          <Kpi title="New Contacts Added" value={String(kpis.newContacts || 0)} />
          <Kpi title="Opportunities Created" value={String(kpis.oppCreated || 0)} />
        </div>
      ) : tab === 'sheet' ? (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleExportSheet}
              className="inline-flex items-center px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50"
            >
              Export to Excel
            </button>
          </div>

          <div className="overflow-x-auto bg-white border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Date</Th>
                  <Th>Target (RM)</Th>
                  <Th>Actual Sales (RM)</Th>
                  <Th>Sales Gap (RM)</Th>
                  <Th>New Contacts</Th>
                  <Th>Opportunities</Th>
                </tr>
              </thead>
              <tbody>
                {sheet.map((r, i) => {
                  const salesGap =
                    Number(r.targetCents || 0) - Number(r.actualCents || 0);
                  const gapCls =
                    salesGap < 0
                      ? 'text-emerald-600'
                      : salesGap > 0
                      ? 'text-rose-600'
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
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-medium border-t">
                  <Td>Total</Td>
                  <Td>
                    {money(
                      sheet.reduce(
                        (s, x) => s + Number(x.targetCents || 0),
                        0
                      )
                    )}
                  </Td>
                  <Td>
                    {money(
                      sheet.reduce(
                        (s, x) => s + Number(x.actualCents || 0),
                        0
                      )
                    )}
                  </Td>
                  <Td>
                    {money(
                      sheet.reduce(
                        (s, x) =>
                          s +
                          Number(x.targetCents || 0) -
                          Number(x.actualCents || 0),
                        0
                      )
                    )}
                  </Td>
                  <Td>
                    {sheet.reduce(
                      (s, x) => s + Number(x.newContacts || 0),
                      0
                    )}
                  </Td>
                  <Td>
                    {sheet.reduce(
                      (s, x) => s + Number(x.oppCreated || 0),
                      0
                    )}
                  </Td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : tab === 'trend' ? (
        <div className="space-y-6">
    {/* build graph-ready data from sheet */}
    {(() => {
      const data = (sheet || []).map(r => ({
        day: r.date.slice(-2),
        target: (Number(r.targetCents || 0) / 100),
        actual: (Number(r.actualCents || 0) / 100),
        gap:    (Number(r.targetCents || 0) - Number(r.actualCents || 0)) / 100,
        contacts: Number(r.newContacts || 0),
        opps:     Number(r.oppCreated || 0),
      }));

      const rm = (v=0) =>
        `RM ${Number(v).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`;
      
      const fmtTick = (iso) => {
        // "2025-09-01" -> "01 Sep"
        const d = new Date(iso + 'T00:00:00');
        return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
      };
      
      const labelFmt = (iso) => {
        // "2025-09-01" -> "Mon, 01 Sep 2025"
        const d = new Date(iso + 'T00:00:00');
        return d.toLocaleDateString(undefined, { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
      };   

      const moneyTooltip = (value, _name, entry) => {
        const key = entry?.dataKey;
        if (key === 'target') return [rm(value), 'Daily Target'];
        if (key === 'actual') return [rm(value), 'Actual Sales'];
        if (key === 'gap')    return [rm(value), 'Sales GAP'];
        return [value, key];
      };
      const countTooltip = (value, _name, entry) => {
        const key = entry?.dataKey;
        if (key === 'contacts') return [value, 'New Contacts'];
        if (key === 'opps')     return [value, 'Opportunities'];
        return [value, key];
      };

      return (
        <div className="space-y-6">
          {/* Graph 1: Target & Actual Sales (Line) */}
          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold mb-3">Target & Actual Sales</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtTick}
                  interval="preserveStartEnd"
                  minTickGap={28}
                />
                <YAxis
                  tickFormatter={(v)=>`RM${Number(v).toLocaleString()}`}
                  width={96} // bagi ruang label kiri tak terpotong
                />
                <Tooltip formatter={(v, n) => (n.includes('Target')||n.includes('Actual') ? money(v*100) : v)} />
                <Legend />
                <Line type="monotone" dataKey="actual" name="Actual Sales" dot={false} stroke="#82ca9d" />
                <Line type="monotone" dataKey="target" name="Daily Target" dot={false} stroke="#242424" />
              </LineChart>
            </ResponsiveContainer>
          </div>
    
          {/* Graph 2: Sales GAP (line) */}
          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold mb-3">Sales GAP (Target − Actual)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={chartData.map(d => ({ date: d.date, gap: (d.target - d.actual) }))}
                margin={{ top: 10, right: 16, bottom: 0, left: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={fmtTick} interval="preserveStartEnd" minTickGap={28} />
                <YAxis tickFormatter={(v)=>`RM${Number(v).toLocaleString()}`} width={96} />
                <Tooltip
                  labelFormatter={labelFmt}
                  formatter={(value, name)=>[rm(value), 'Sales GAP']}
                />
                <Legend />
                <Line type="monotone" dataKey="gap" name="Sales GAP" dot={false} stroke="#edc001" />
              </LineChart>
            </ResponsiveContainer>
          </div>
    
          {/* Graph 3: New Contacts & Opportunities (bar) */}
            <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold mb-3">New Contacts & Opportunities</h3>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="date"
                    tickFormatter={fmtTick}
                    interval="preserveStartEnd"
                    minTickGap={28}
                />
                <YAxis yAxisId="left"  allowDecimals={false} width={56} />
                <YAxis yAxisId="right" allowDecimals={false} orientation="right" width={24} />
                <Tooltip
                    labelFormatter={labelFmt}
                    formatter={(value, name) => {
                    if (name === 'contacts') return [value, 'New Contacts'];
                    if (name === 'opps')     return [value, 'Opportunities'];
                    return [value, name];
                    }}
                />
                <Legend />
                {/* beri warna yang jelas */}
                <Bar
                    yAxisId="left"
                    dataKey="contacts"
                    name="New Contacts"
                    fill="#60A5FA"   // biru (tailwind blue-400)
                    barSize={14}
                />
                <Bar
                    yAxisId="right"
                    dataKey="opps"
                    name="Opportunities"
                    fill="#34D399"   // hijau (tailwind emerald-400)
                    barSize={14}
                />
                </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 mt-2">
                Green/grey charts di atas = RM; bar chart ini = bilangan.
            </div>
            </div>
        </div>
      );
    })()}
  </div>
      ) : (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
            <Kpi
            title="Prospect → Deal"
            value={`${conv?.prospectToDeal?.count || 0} (${ratio(conv?.prospectToDeal?.count, conv?.prospectToDeal?.totalNewOpps)})`}
            />
            <Kpi
            title="Deal → Outcome"
            value={`${conv?.dealToOutcome?.count || 0} (${ratio(conv?.dealToOutcome?.count, conv?.dealToOutcome?.totalDeals)})`}
            />
            <Kpi
            title="Win Rate"
            value={`${conv?.winRate?.countWon || 0} (${ratio(conv?.winRate?.countWon, conv?.winRate?.totalNewOpps)})`}
            />
        </div>

        <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold mb-3">Top Stage Transitions</h3>
            <table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr><Th>From</Th><Th>To</Th><Th>Count</Th></tr></thead>
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
            <thead className="bg-gray-50"><tr><Th>From</Th><Th>To</Th><Th>Count</Th></tr></thead>
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

/* small atoms */
function Kpi({ title, value, strong, valueClass }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className={cls('mt-1 text-2xl tracking-tight', strong ? 'font-bold' : 'font-semibold', valueClass)}>
        {value}
      </div>
    </div>
  );
}
function Th({ children }) { return <th className="text-left p-2 border-b font-medium text-gray-600">{children}</th>; }
function Td({ children, className }) { return <td className={cls('p-2', className)}>{children}</td>; }

// ===== CSV export helper (Excel-compatible) =====
function exportSheetToCsv({ sheet, from, to, scopeLabel }) {
  const header = [
    'Date',
    'Target (RM)',
    'Actual (RM)',
    'Sales Gap (RM)',
    'New Contacts',
    'Opportunities',
  ];

  const rows = (sheet || []).map((r) => {
    const target = (Number(r.targetCents || 0) / 100).toFixed(2);
    const actual = (Number(r.actualCents || 0) / 100).toFixed(2);
    const gap =
      (Number(r.targetCents || 0) - Number(r.actualCents || 0)) / 100;

    return [
      r.date,
      target,
      actual,
      gap.toFixed(2),
      Number(r.newContacts || 0),
      Number(r.oppCreated || 0),
    ];
  });

  const lines = [header, ...rows].map((cols) =>
    cols.map(csvEscape).join(',')
  );

  const csvContent = lines.join('\r\n');
  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const safeScope = String(scopeLabel || 'me')
    .toLowerCase()
    .replace(/\s+/g, '-');
  const fileName = `my-performance-${safeScope}-${from || 'from'}_to_${
    to || 'to'
  }.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  if (value == null) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

