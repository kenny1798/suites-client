import React, { useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  startOfToday,
  endOfToday,
  subDays,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { useTeam } from '@suite/core-context';
import { useDashboardData } from '../hooks/useDashboardData';

const formatRM = (val) => `RM${(Number(val || 0) / 100).toFixed(2)}`;

function DateRangePresets({ setStartDate, setEndDate }) {
  const presets = [
    { label: 'Today', action: () => { setStartDate(startOfToday()); setEndDate(endOfToday()); } },
    { label: 'Yesterday', action: () => { const y = subDays(new Date(), 1); setStartDate(y); setEndDate(y); } },
    { label: 'Last 7 days', action: () => { setStartDate(subDays(new Date(), 6)); setEndDate(endOfToday()); } },
    { label: 'This Month', action: () => { setStartDate(startOfMonth(new Date())); setEndDate(endOfToday()); } },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map(p => (
        <button key={p.label} onClick={p.action} className="px-3 py-1 text-sm bg-white border rounded-md hover:bg-slate-50">{p.label}</button>
      ))}
    </div>
  );
}

function StatCard({ title, value, hint }) {
  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

// === helper: kira funnel dari categoryTransitions + opportunitiesCreated ===
function useFunnel(conversions, opportunitiesCreated) {
  return useMemo(() => {
    const ct = conversions?.categoryTransitions || [];
    const get = (from, to) =>
      ct.find(x => x.fromCategory === from && x.toCategory === to)?.count || 0;

    const p2d = get('Prospect', 'Deal');
    const d2o = get('Deal', 'Outcome');
    const win = get('Prospect', 'Outcome') + d2o; // ada team terus lompat Prospect→Outcome

    // elak 0 div
    const denomP = Math.max(opportunitiesCreated || 0, 1);
    const denomD = Math.max(p2d, 1);

    return {
      prospectToDeal: { count: p2d, rate: p2d / denomP },
      dealToOutcome:  { count: d2o, rate: d2o / denomD },
      winRate:        { count: win, rate: win / denomP },
    };
  }, [conversions, opportunitiesCreated]);
}

export default function SalesTrackDashboard() {
  const { activeTeam } = useTeam();
  const [viewMode, setViewMode] = useState('summary');
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfToday());
  const [visibleMetrics, setVisibleMetrics] = useState({
    target: true,
    actualSales: true,
    newContacts: true,
  });

  const { data, isLoading, error } = useDashboardData(activeTeam?.id, startDate, endDate);
  const handleMetricToggle = (metric) => setVisibleMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));

  const daily = data?.dailyBreakdown || [];
  const sales = data?.sales || { targetedSales:0, actualSales:0, salesGap:0, wonDeals:0, avgDealSize:0, medianDealSize:0 };
  const intake = data?.intake || { contactsAdded:0, opportunitiesCreated:0 };
  const conversions = data?.conversions || { stageTransitions: [], categoryTransitions: [] };

  const funnel = useFunnel(conversions, intake.opportunitiesCreated);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">SalesTrack Dashboard</h1>
          <p className="text-slate-500">Performance summary for {activeTeam?.name || 'your team'}.</p>
        </div>
      </div>

      <div className="space-y-4 p-4 bg-white border rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <DateRangePresets setStartDate={setStartDate} setEndDate={setEndDate} />
          <div className="flex items-center gap-2 text-sm">
            <DatePicker selected={startDate} onChange={(d) => setStartDate(d)} selectsStart startDate={startDate} endDate={endDate} className="w-full rounded-md border px-3 py-2" />
            <span>to</span>
            <DatePicker selected={endDate} onChange={(d) => setEndDate(d)} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} className="w-full rounded-md border px-3 py-2" />
          </div>
        </div>
      </div>

      <div className="border-b">
        <div className="flex items-center gap-4 text-sm font-medium">
          <button onClick={() => setViewMode('summary')} className={`py-2 ${viewMode === 'summary' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500'}`}>Summary</button>
          <button onClick={() => setViewMode('sheet')} className={`py-2 ${viewMode === 'sheet' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500'}`}>Sheet</button>
          <button onClick={() => setViewMode('graph')} className={`py-2 ${viewMode === 'graph' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500'}`}>Graph</button>
          <button onClick={() => setViewMode('conversions')} className={`py-2 ${viewMode === 'conversions' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500'}`}>Conversions</button>
        </div>
      </div>

      {isLoading && <div className="text-center p-8">Loading dashboard data...</div>}
      {error && <div className="text-center p-8 text-red-600">Failed to load data. Please try again.</div>}

      {data && !isLoading && (
        <>
          {viewMode === 'summary' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Targeted Sales" value={formatRM(sales.targetedSales)} />
                <StatCard title="Actual Sales" value={formatRM(sales.actualSales)} />
                <StatCard title="Sales Gap" value={formatRM(sales.salesGap)} />
                <StatCard title="Won Deals" value={sales.wonDeals} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="New Contacts Added" value={intake.contactsAdded} />
                <StatCard title="Opportunities Created" value={intake.opportunitiesCreated} />
                <StatCard title="Avg Deal Size" value={formatRM(sales.avgDealSize)} hint="Average of closed deals in range" />
                <StatCard title="Median Deal Size" value={formatRM(sales.medianDealSize)} hint="Median of closed deals in range" />
              </div>
            </>
          )}

          {viewMode === 'sheet' && (
            <div className="bg-white rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-left font-semibold">Date</th>
                    <th className="p-3 text-right font-semibold">Target (RM)</th>
                    <th className="p-3 text-right font-semibold">Actual Sales (RM)</th>
                    <th className="p-3 text-right font-semibold">New Contacts</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map(day => (
                    <tr key={day.date} className="border-t hover:bg-slate-50">
                      <td className="p-3">{new Date(day.date).toLocaleDateString('en-GB')}</td>
                      <td className="p-3 text-right">{formatRM(day.target)}</td>
                      <td className="p-3 text-right font-medium">{formatRM(day.actualSales)}</td>
                      <td className="p-3 text-right">{day.newContacts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'graph' && (
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center flex-wrap gap-4 mb-4 text-xs">
                {Object.keys(visibleMetrics).map(metricKey => (
                  <label key={metricKey} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={visibleMetrics[metricKey]} onChange={() => handleMetricToggle(metricKey)} />
                    {metricKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                ))}
              </div>
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(dateStr) => new Date(dateStr).getDate()} />
                    <YAxis yAxisId="left" orientation="left" stroke="#10b981" tickFormatter={(value) => `RM${value / 100}`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ddd' }} formatter={(value, name) => (name.includes('Sales') || name.includes('Target') ? formatRM(value) : value)} />
                    <Legend />
                    {visibleMetrics.target && <Bar yAxisId="left" dataKey="target" fill="#a8a29e" name="Daily Target" />}
                    {visibleMetrics.actualSales && <Bar yAxisId="left" dataKey="actualSales" fill="#10b981" name="Actual Sales" />}
                    {visibleMetrics.newContacts && <Bar yAxisId="right" dataKey="newContacts" fill="#3b82f6" name="New Contacts" />}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {viewMode === 'conversions' && (
            <div className="space-y-6">
              {/* Funnel cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title="Prospect → Deal"
                  value={`${funnel.prospectToDeal.count} (${Math.round(funnel.prospectToDeal.rate * 100)}%)`}
                  hint={`Out of ${intake.opportunitiesCreated} new opportunities`}
                />
                <StatCard
                  title="Deal → Outcome"
                  value={`${funnel.dealToOutcome.count} (${Math.round(funnel.dealToOutcome.rate * 100)}%)`}
                  hint={`Out of ${Math.max(funnel.prospectToDeal.count, 0)} deals`}
                />
                <StatCard
                  title="Win Rate"
                  value={`${funnel.winRate.count} (${Math.round(funnel.winRate.rate * 100)}%)`}
                  hint={`Out of ${intake.opportunitiesCreated} new opportunities`}
                />
              </div>

              {/* Top stage transitions */}
              <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                  <h3 className="text-sm font-semibold text-slate-800">Top Stage Transitions</h3>
                  <p className="text-xs text-slate-500">Status → Status (ikut data team anda)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3 text-left font-semibold">From</th>
                        <th className="p-3 text-left font-semibold">To</th>
                        <th className="p-3 text-right font-semibold">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(conversions.stageTransitions || [])
                        .slice() // copy
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 12)
                        .map((t, i) => (
                          <tr key={`${t.fromStatusId}->${t.toStatusId}-${i}`} className="border-t hover:bg-slate-50">
                            <td className="p-3">{t.fromName}</td>
                            <td className="p-3">→ {t.toName}</td>
                            <td className="p-3 text-right font-medium">{t.count}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category transitions (optional ringkas) */}
              <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                  <h3 className="text-sm font-semibold text-slate-800">Category Transitions</h3>
                  <p className="text-xs text-slate-500">Prospect / Deal / Outcome / Ongoing</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3 text-left font-semibold">From</th>
                        <th className="p-3 text-left font-semibold">To</th>
                        <th className="p-3 text-right font-semibold">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(conversions.categoryTransitions || [])
                        .slice()
                        .sort((a, b) => b.count - a.count)
                        .map((t, idx) => (
                          <tr key={`${t.fromCategory}->${t.toCategory}-${idx}`} className="border-t hover:bg-slate-50">
                            <td className="p-3">{t.fromCategory}</td>
                            <td className="p-3">→ {t.toCategory}</td>
                            <td className="p-3 text-right font-medium">{t.count}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
