// salestrack/src/pages/DashboardContent.jsx
import { useEffect, useMemo, useState } from 'react';
import { toolsApi } from '@suite/api-clients';
import { formatISO, startOfMonth, endOfMonth } from 'date-fns';

export default function DashboardContent({ teamId }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return {
      startDate: formatISO(start, { representation: 'date' }),
      endDate: formatISO(end, { representation: 'date' }),
    };
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await toolsApi.get('/api/salestrack/dashboard', {
          params: { teamId, startDate: range.startDate, endDate: range.endDate },
        });
        setData(res.data);
        setErr(null);
      } catch (e) {
        setErr(e?.response?.data?.error || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    }
    if (teamId) load();
  }, [teamId, range.startDate, range.endDate]);

  if (loading) return <div className="p-6 text-gray-500">Loading dashboard…</div>;
  if (err) return <ErrorState message={err} />;

  const s = data?.sales || {};
  const i = data?.intake || {};
  const conv = data?.conversions || {};

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="Targeted Sales" value={toRM(s.targetedSales)} />
        <Kpi title="Actual Sales" value={toRM(s.actualSales)} />
        <Kpi
          title="Gap"
          value={toRM(s.salesGap)}
          badgeClass={s.salesGap > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}
        />
        <Kpi title="Won Deals" value={String(s.wonDeals || 0)} />
        <Kpi title="Avg Deal Size" value={toRM(s.avgDealSize)} />
        <Kpi title="Median Deal Size" value={toRM(s.medianDealSize)} />
        <Kpi title="New Contacts" value={String(i.contactsAdded || 0)} />
        <Kpi title="New Opportunities" value={String(i.opportunitiesCreated || 0)} />
      </div>

      {/* Stage transitions (top 6) */}
      <section className="space-y-3">
        <h2 className="text-base font-medium">Top Stage Transitions</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {(conv?.stageTransitions || []).slice(0, 6).map((t, idx) => (
            <div key={idx} className="border rounded-lg p-3 flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">{t.fromName}</span>
                <span className="mx-2 text-gray-400">→</span>
                <span className="font-medium">{t.toName}</span>
              </div>
              <span className="px-2 py-0.5 text-xs rounded bg-gray-100">{t.count}</span>
            </div>
          ))}
          {(!conv?.stageTransitions || conv.stageTransitions.length === 0) && (
            <div className="text-gray-500 text-sm">No transitions yet.</div>
          )}
        </div>
      </section>

      {/* Daily line as simple list (boleh upgrade chart kemudian) */}
      <section className="space-y-3">
        <h2 className="text-base font-medium">Daily Sales vs Target</h2>
        <div className="space-y-1 text-sm">
          {(data?.dailyBreakdown || []).map((d) => (
            <div key={d.date} className="flex items-center gap-3">
              <div className="w-24 text-gray-600">{d.date}</div>
              <Bar label="Target" val={d.target} max={Math.max(d.target, d.actualSales)} />
              <Bar label="Sales" val={d.actualSales} max={Math.max(d.target, d.actualSales)} tone="sales" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({ title, value, badgeClass = 'bg-gray-100 text-gray-700' }) {
  return (
    <div className="border rounded-xl p-4 bg-white">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded ${badgeClass}`}>{title}</span>
    </div>
  );
}
function Bar({ label, val = 0, max = 1, tone }) {
  const pct = Math.min(100, Math.round((val / (max || 1)) * 100));
  const base = tone === 'sales' ? 'bg-emerald-500' : 'bg-gray-400';
  return (
    <div className="flex-1 flex items-center gap-2">
      <div className="h-2 w-full rounded bg-gray-100 overflow-hidden">
        <div className={`h-2 ${base}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-28 text-right text-xs text-gray-600">{toRM(val)}</div>
    </div>
  );
}
function ErrorState({ message }) {
  return (
    <div className="p-6 flex items-center justify-center">
      <div className="max-w-sm w-full border rounded-xl bg-amber-50 p-6 text-center">
        <div className="text-amber-700 font-medium mb-1">Something Went Wrong</div>
        <div className="text-amber-700/80 text-sm">{message}</div>
      </div>
    </div>
  );
}
function toRM(cents = 0) {
  return `RM ${(Number(cents) / 100).toFixed(2)}`;
}
