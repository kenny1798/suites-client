// packages/salestrack/src/pages/ManagerPerformance.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useTeam } from '@suite/core-context';
import { useAuth } from '@suite/auth';
import { toolsApi } from '@suite/api-clients';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const money = (cents = 0) =>
  `RM${(Number(cents || 0) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ===== date helpers =====
export function todayStr() {
  const d = new Date(); // local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`; // 'YYYY-MM-DD' (local)
}

export function addDays(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

const labelFmt = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const fmtTick = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
  });
};

const cls = (...xs) => xs.filter(Boolean).join(' ');

// conversions cards helper (returns number)
const pctNumber = (n = 0, d = 0) =>
  d ? Math.round((Number(n) / Number(d)) * 100) : 0;

export default function ManagerPerformance() {
  const { activeTeam } = useTeam();
  const { user } = useAuth();
  const teamId = activeTeam?.id;
  const managerId = user?.id;

  const today = todayStr();

  // range
  const [from, setFrom] = useState(() => todayStr().slice(0, 7) + '-01');
  const [to, setTo] = useState(() => todayStr());

  // ui
  const [tab, setTab] = useState('summary'); // summary | sheet | trend | forecast | conversions
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // rep selection
  const [reps, setReps] = useState([]); // [{id, name}]
  const [pick, setPick] = useState('team'); // 'team' OR repId (number as string)

  // data
  const [kpis, setKpis] = useState({
    targetCents: 0,
    actualCents: 0,
    wonDeals: 0,
    newContacts: 0,
    oppCreated: 0,
    scope: 'team',
  });
  const [sheet, setSheet] = useState([]); // [{ date, targetCents, actualCents, newContacts, oppCreated }]
  const [conv, setConv] = useState(null);

  const isMobile = useIsMobile();
  const axisTick = { fontSize: isMobile ? 10 : 12 };
  const legendStyle = { fontSize: isMobile ? 10 : 12 };

  // ===== fetch reps under this manager =====
  useEffect(() => {
    let mounted = true;
    async function loadReps() {
      if (!teamId || !managerId) return;
      try {
        const res = await toolsApi.get(
          '/api/salestrack/analytics/manager/reps',
          {
            params: { teamId, managerId },
          }
        );
        if (!mounted) return;
        setReps(res.data?.reps || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadReps();
    return () => {
      mounted = false;
    };
  }, [teamId, managerId]);

  // ===== fetch summary + sheet + conversions =====
  async function load() {
    if (!teamId || !managerId) return;
    setLoading(true);
    try {
      const tzOffset = -new Date().getTimezoneOffset();
      const scope = pick === 'team' ? 'team' : 'rep';
      const repUserId = scope === 'rep' ? Number(pick) : undefined;

      const sheetEndpoint =
        scope === 'team'
          ? '/api/salestrack/analytics/manager/sheet'
          : '/api/salestrack/analytics/manager/rep/sheet';

      const [sumRes, sheetRes, convRes] = await Promise.all([
        toolsApi.get('/api/salestrack/analytics/manager/summary', {
          params: { teamId, managerId, scope, repUserId, from, to, tzOffset },
        }),
        toolsApi.get(sheetEndpoint, {
          params:
            scope === 'team'
              ? { teamId, managerId, from, to, tzOffset }
              : { teamId, repUserId, from, to, tzOffset },
        }),
        toolsApi.get('/api/salestrack/analytics/manager/conversions', {
          params: { teamId, from, to, tzOffset, repUserId },
        }),
      ]);

      setKpis(
        sumRes.data?.kpis || {
          targetCents: 0,
          actualCents: 0,
          wonDeals: 0,
          newContacts: 0,
          oppCreated: 0,
          scope,
        }
      );
      setSheet(sheetRes.data?.sheet || []);
      setConv(convRes.data || null);
      setErr(null);
    } catch (e) {
      console.error(e);
      setErr(
        e?.response?.data?.error || 'Failed to load manager performance.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [teamId, managerId, from, to, pick]);

  // ===== graphs (built from sheet) =====
  const graphData = useMemo(
    () =>
      sheet.map((r) => ({
        date: r.date,
        Actual: (r.actualCents || 0) / 100,
        Target: (r.targetCents || 0) / 100,
        Gap: ((r.targetCents || 0) - (r.actualCents || 0)) / 100,
        NewContacts: r.newContacts || 0,
        Opportunities: r.oppCreated || 0,
      })),
    [sheet]
  );

  const salesGap = (kpis.targetCents || 0) - (kpis.actualCents || 0);

    // ===== Export Sheet to Excel (CSV) =====
  const handleExportSheet = () => {
    if (!sheet || sheet.length === 0) {
      window.alert('No data to export for this range.');
      return;
    }

    const scopeLabel =
      pick === 'team'
        ? 'team'
        : reps.find((r) => String(r.id) === String(pick))?.name ||
          `rep-${pick}`;

    exportSheetToCsv({ sheet, from, to, scopeLabel });
  };

  // ========= Forecast metrics (same behaviour as TeamPerformance) =========
  const forecast = useMemo(() => {
    if (!sheet || sheet.length === 0) {
      return { available: false, reason: 'NO_DATA' };
    }

    const safeFrom = String(from || '').slice(0, 10);
    const safeTo = String(to || '').slice(0, 10);

    const daysElapsed = sheet.length;

    const totalTargetCents = sheet.reduce(
      (s, r) => s + Number(r.targetCents || 0),
      0
    );
    const totalActualCents = sheet.reduce(
      (s, r) => s + Number(r.actualCents || 0),
      0
    );
    const totalNewContacts = sheet.reduce(
      (s, r) => s + Number(r.newContacts || 0),
      0
    );
    const totalOpps = sheet.reduce(
      (s, r) => s + Number(r.oppCreated || 0),
      0
    );

    const avgDailyTargetCents =
      daysElapsed > 0 ? totalTargetCents / daysElapsed : 0;
    const avgDailySalesCents =
      daysElapsed > 0 ? totalActualCents / daysElapsed : 0;

    const fromMonth = safeFrom.slice(0, 7);
    const toMonth = safeTo.slice(0, 7);
    const sameMonth = fromMonth && toMonth && fromMonth === toMonth;
    const startsOnFirst = safeFrom.endsWith('-01');

    let mode = 'rolling';
    if (sameMonth && startsOnFirst) mode = 'monthly';

    let windowDays;
    let projectedTargetCents;
    let projectedSalesCents;
    let expectedGapCents;
    let daysRemaining;
    let remainingToTargetCents;
    let requiredDailyToHitTargetCents = 0;
    let title;
    let chartData = [];
    let daysInMonth = null;

    if (mode === 'monthly') {
      const [yStr, mStr] = fromMonth.split('-');
      const year = Number(yStr);
      const month = Number(mStr);
      if (!year || !month) {
        return { available: false, reason: 'INVALID_RANGE' };
      }

      daysInMonth = new Date(year, month, 0).getDate();
      windowDays = daysInMonth;

      const fullMonthTargetCents = avgDailyTargetCents * daysInMonth;
      projectedTargetCents = fullMonthTargetCents;
      projectedSalesCents = avgDailySalesCents * daysInMonth;
      expectedGapCents = fullMonthTargetCents - projectedSalesCents;

      daysRemaining = Math.max(daysInMonth - daysElapsed, 0);
      remainingToTargetCents = fullMonthTargetCents - totalActualCents;
      if (remainingToTargetCents > 0 && daysRemaining > 0) {
        requiredDailyToHitTargetCents =
          remainingToTargetCents / daysRemaining;
      }

      const baseDate = new Date(`${fromMonth}-01T00:00:00`);
      const monthLabel = baseDate.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      });
      title = `Monthly forecast for ${monthLabel}`;

      const sheetByDate = new Map();
      sheet.forEach((r) => sheetByDate.set(r.date, r));

      let cumTarget = 0;
      let cumActual = 0;
      let cumForecast = 0;
      const lastDayInRange = Number(safeTo.slice(8, 10)) || daysElapsed;

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${fromMonth}-${dayStr}`;
        const row = sheetByDate.get(dateStr);

        const dailyTarget = avgDailyTargetCents;
        const dailyActual = row ? Number(row.actualCents || 0) : 0;

        cumTarget += dailyTarget;

        if (day <= lastDayInRange) {
          cumActual += dailyActual;
          cumForecast = cumActual;
        } else {
          cumForecast += avgDailySalesCents;
        }

        chartData.push({
          date: dateStr,
          cumTarget: cumTarget / 100,
          cumActual: cumActual / 100,
          cumForecast: cumForecast / 100,
        });
      }
    } else {
      const horizonDays = daysElapsed;
      windowDays = horizonDays;

      projectedTargetCents = avgDailyTargetCents * horizonDays;
      projectedSalesCents = avgDailySalesCents * horizonDays;
      expectedGapCents = projectedTargetCents - projectedSalesCents;

      daysRemaining = horizonDays;
      remainingToTargetCents = expectedGapCents;
      requiredDailyToHitTargetCents = avgDailyTargetCents;

      title = `Rolling forecast for the next ${horizonDays} day${
        horizonDays === 1 ? '' : 's'
      }`;

      let cumTarget = 0;
      let cumActual = 0;
      let cumForecast = 0;

      sheet.forEach((r) => {
        const dailyTarget = Number(r.targetCents || 0);
        const dailyActual = Number(r.actualCents || 0);

        cumTarget += dailyTarget;
        cumActual += dailyActual;
        cumForecast = cumActual;

        chartData.push({
          date: r.date,
          cumTarget: cumTarget / 100,
          cumActual: cumActual / 100,
          cumForecast: cumForecast / 100,
        });
      });

      const startFuture = safeTo;
      for (let i = 0; i < horizonDays; i++) {
        const dateStr = addDays(startFuture, i + 1);
        cumTarget += avgDailyTargetCents;
        cumForecast += avgDailySalesCents;
        chartData.push({
          date: dateStr,
          cumTarget: cumTarget / 100,
          cumActual: cumActual / 100,
          cumForecast: cumForecast / 100,
        });
      }
    }

    const projectedAchievementPct =
      projectedTargetCents > 0
        ? (projectedSalesCents / projectedTargetCents) * 100
        : 0;

    let revenuePerContactCents = null;
    let revenuePerOppCents = null;
    if (totalNewContacts > 0) {
      revenuePerContactCents = totalActualCents / totalNewContacts;
    }
    if (totalOpps > 0) {
      revenuePerOppCents = totalActualCents / totalOpps;
    }

    let contactsNeeded = null;
    let oppsNeeded = null;
    const gapForPipelineCents =
      remainingToTargetCents && remainingToTargetCents > 0
        ? remainingToTargetCents
        : 0;

    if (gapForPipelineCents > 0) {
      if (revenuePerContactCents > 0) {
        contactsNeeded = gapForPipelineCents / revenuePerContactCents;
      }
      if (revenuePerOppCents > 0) {
        oppsNeeded = gapForPipelineCents / revenuePerOppCents;
      }
    }

    let confidence = 'Low';
    if (daysElapsed >= 30) confidence = 'High';
    else if (daysElapsed >= 10) confidence = 'Medium';

    const confidenceDescription = `Based on ${daysElapsed} day${
      daysElapsed === 1 ? '' : 's'
    } of data in the selected range.`;

    return {
      available: true,
      reason: null,
      mode,
      title,
      daysElapsed,
      windowDays,
      daysRemaining,
      projectedSalesCents,
      projectedTargetCents,
      projectedAchievementPct,
      expectedGapCents,
      avgDailySalesCents,
      avgDailyTargetCents,
      remainingToTargetCents,
      requiredDailyToHitTargetCents,
      totalActualCents,
      totalTargetCents,
      totalNewContacts,
      totalOpps,
      contactsNeeded,
      oppsNeeded,
      confidence,
      confidenceDescription,
      chartData,
    };
  }, [sheet, from, to]);

  const forecastSummaryText = useMemo(
    () => getForecastSummaryText(forecast),
    [forecast]
  );

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Team Performance</h1>
        <p className="text-sm text-gray-500">
          Analyze your team’s overall results and productivity
        </p>
      </div>

      {/* top controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="border rounded px-3 py-1.5"
          value={pick}
          onChange={(e) => setPick(e.target.value)}
        >
          <option value="team">My Team (overall)</option>
          {reps.map((r) => (
            <option key={r.id} value={String(r.id)}>
              {r.name || `User #${r.id}`}
            </option>
          ))}
        </select>
      </div>

      {/* date range controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="px-3 py-1.5 rounded border"
          onClick={() => {
            const t = todayStr();
            setFrom(t);
            setTo(t);
          }}
        >
          Today
        </button>
        <button
          className="px-3 py-1.5 rounded border"
          onClick={() => {
            const t = todayStr();
            const y = addDays(t, -1);
            setFrom(y);
            setTo(y);
          }}
        >
          Yesterday
        </button>
        <button
          className="px-3 py-1.5 rounded border"
          onClick={() => {
            const t = todayStr();
            setFrom(addDays(t, -6));
            setTo(t);
          }}
        >
          Last 7 days
        </button>
        <button
          className="px-3 py-1.5 rounded border"
          onClick={() => {
            const t = todayStr();
            setFrom(t.slice(0, 7) + '-01');
            setTo(t);
          }}
        >
          This Month
        </button>

        {/* date inputs – responsive */}
        <div className="w-full sm:w-auto sm:ml-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="date"
              className="border rounded px-3 py-1.5 flex-1 min-w-0"
              value={from}
              onChange={(e) => {
                const v = e.target.value;
                const capped = v > today ? today : v;
                setFrom(capped > to ? to : capped);
              }}
              max={to || today}
            />
            <span className="text-sm text-gray-500">to</span>
            <input
              type="date"
              className="border rounded px-3 py-1.5 flex-1 min-w-0"
              value={to}
              onChange={(e) => {
                const v = e.target.value;
                const capped = v > today ? today : v;
                setTo(capped < from ? from : capped);
              }}
              max={today}
            />
          </div>
        </div>
      </div>

      {/* tabs – add Forecast + mobile scroll */}
      <div className="border-b overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {['summary', 'sheet', 'trend', 'forecast', 'conversions'].map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cls(
                'px-3 py-2 -mb-px whitespace-nowrap flex-shrink-0',
                tab === k
                  ? 'border-b-2 border-black font-medium'
                  : 'text-gray-500'
              )}
            >
              {k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* content */}
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : err ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-800">
          {err}
        </div>
      ) : tab === 'summary' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Kpi title="Targeted Sales" value={money(kpis.targetCents)} />
          <Kpi title="Actual Sales" value={money(kpis.actualCents)} />
          <Kpi
            title="Sales GAP (Target − Actual)"
            value={money(salesGap)}
            valueClass={
              salesGap > 0
                ? 'text-red-500'
                : salesGap < 0
                ? 'text-emerald-600'
                : ''
            }
          />
          <Kpi title="Won Deals" value={String(kpis.wonDeals || 0)} />
          <Kpi title="New Contacts" value={String(kpis.newContacts || 0)} />
          <Kpi title="Opportunities" value={String(kpis.oppCreated || 0)} />
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
                  <Th>Actual (RM)</Th>
                  <Th>Sales Gap (RM)</Th>
                  <Th>New Contacts</Th>
                  <Th>Opportunities</Th>
                </tr>
              </thead>
              <tbody>
                {sheet.map((r, i) => {
                  const gap =
                    Number(r.targetCents || 0) - Number(r.actualCents || 0);
                  const gapCls =
                    gap < 0
                      ? 'text-emerald-600'
                      : gap > 0
                      ? 'text-rose-600'
                      : '';

                  return (
                    <tr key={i} className="border-t">
                      <Td>{r.date}</Td>
                      <Td>{money(r.targetCents)}</Td>
                      <Td>{money(r.actualCents)}</Td>
                      <Td className={gapCls}>{money(gap)}</Td>
                      <Td>{r.newContacts || 0}</Td>
                      <Td>{r.oppCreated || 0}</Td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-medium border-t">
                  <Td>Total</Td>
                  <Td>{money(sum(sheet, 'targetCents'))}</Td>
                  <Td>{money(sum(sheet, 'actualCents'))}</Td>
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
                  <Td>{sum(sheet, 'newContacts')}</Td>
                  <Td>{sum(sheet, 'oppCreated')}</Td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : tab === 'forecast' ? (
        <div className="space-y-6">
          {!forecast.available ? (
            <div className="rounded-xl border bg-amber-50 text-amber-800 p-4 text-sm">
              {forecast.reason === 'NO_DATA' &&
                'No data available for this date range. Add some activity to see a forecast.'}
              {forecast.reason === 'INVALID_RANGE' &&
                'The selected date range is not valid for forecasting.'}
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold">{forecast.title}</h3>
                <span className="text-xs text-gray-500">
                  {forecast.confidenceDescription}
                </span>
              </div>

              {/* top KPI row */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Kpi
                  title={
                    forecast.mode === 'monthly'
                      ? 'Projected Monthly Sales'
                      : `Projected Sales (Next ${forecast.windowDays} days)`
                  }
                  value={money(forecast.projectedSalesCents)}
                />
                <Kpi
                  title={
                    forecast.mode === 'monthly'
                      ? 'Full Month Target'
                      : `Expected Target (Next ${forecast.windowDays} days)`
                  }
                  value={money(forecast.projectedTargetCents)}
                />
                <Kpi
                  title="Projected Target Achievement"
                  value={`${Math.round(
                    forecast.projectedAchievementPct || 0
                  )}%`}
                />
                <Kpi
                  title={
                    forecast.mode === 'monthly'
                      ? 'Expected Gap at Month End'
                      : 'Expected Gap for Forecast Period'
                  }
                  value={money(forecast.expectedGapCents)}
                  valueClass={
                    forecast.expectedGapCents > 0
                      ? 'text-red-600'
                      : forecast.expectedGapCents < 0
                      ? 'text-emerald-600'
                      : ''
                  }
                />
              </div>

              {/* second row */}
              <div className="grid sm:grid-cols-3 gap-4">
                <CardStat
                  title="Average Daily Sales (Sample)"
                  value={money(forecast.avgDailySalesCents)}
                  hint={`Across ${forecast.daysElapsed} day${
                    forecast.daysElapsed === 1 ? '' : 's'
                  } in the selected range.`}
                />
                <CardStat
                  title={
                    forecast.mode === 'monthly'
                      ? 'Required Daily Sales to Hit Target'
                      : 'Daily Sales Needed to Match Target Pace'
                  }
                  value={
                    forecast.mode === 'monthly' &&
                    forecast.remainingToTargetCents <= 0
                      ? 'Target already reached'
                      : money(forecast.requiredDailyToHitTargetCents)
                  }
                  hint={
                    forecast.mode === 'monthly'
                      ? forecast.remainingToTargetCents <= 0
                        ? 'You have already met or exceeded this month’s target.'
                        : `Needed over the remaining ${forecast.daysRemaining} day${
                            forecast.daysRemaining === 1 ? '' : 's'
                          } of the month.`
                      : `If you keep this daily average, the next ${forecast.windowDays} days will follow the same target pace.`
                  }
                />
                <CardStat
                  title="Forecast Confidence"
                  value={forecast.confidence}
                  hint={forecast.confidenceDescription}
                />
              </div>

              {/* pipeline estimation */}
              {forecast.remainingToTargetCents > 0 &&
                (forecast.contactsNeeded || forecast.oppsNeeded) && (
                  <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
                    <div className="font-semibold mb-1">
                      How much pipeline do you need?
                    </div>
                    <p>
                      To close the gap for this period, the team needs
                      approximately{' '}
                      {forecast.contactsNeeded
                        ? `${Math.round(
                            forecast.contactsNeeded
                          )} more contacts`
                        : ''}
                      {forecast.contactsNeeded && forecast.oppsNeeded
                        ? ' or '
                        : ''}
                      {forecast.oppsNeeded
                        ? `${Math.round(
                            forecast.oppsNeeded
                          )} more opportunities`
                        : ''}
                      , assuming the current conversion rate and average deal
                      size stay the same.
                    </p>
                  </div>
                )}

              {/* cumulative chart */}
              <div className="rounded-xl border bg-white p-4">
                <h3 className="text-sm font-semibold mb-3">
                  Cumulative Sales vs Target (with Forecast)
                </h3>
                <ChartWrap isMobile={isMobile}>
                  <LineChart
                    data={forecast.chartData || []}
                    margin={
                      isMobile
                        ? { top: 8, right: 8, bottom: 0, left: 0 }
                        : { top: 10, right: 28, bottom: 0, left: 0 }
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={fmtTick}
                      interval="preserveStartEnd"
                      minTickGap={isMobile ? 10 : 28}
                      tick={{
                        ...axisTick,
                        angle: isMobile ? -30 : 0,
                        dy: isMobile ? 10 : 0,
                      }}
                    />
                    <YAxis
                      tickFormatter={(v) =>
                        `RM${Number(v).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}`
                      }
                      tick={axisTick}
                      width={isMobile ? 64 : 96}
                    />
                    <Tooltip
                      wrapperStyle={{ fontSize: legendStyle.fontSize }}
                      contentStyle={{ fontSize: legendStyle.fontSize }}
                      formatter={(v, name) =>
                        name.includes('Target') ||
                        name.includes('Actual') ||
                        name.includes('Forecast')
                          ? money(Number(v) * 100)
                          : v
                      }
                    />
                    <Legend wrapperStyle={legendStyle} />
                    <Line
                      type="monotone"
                      dataKey="cumActual"
                      stroke="#10b981"
                      dot={false}
                      name="Actual (cumulative)"
                    />
                    <Line
                      type="monotone"
                      dataKey="cumTarget"
                      stroke="#9ca3af"
                      dot={false}
                      name="Target (cumulative)"
                    />
                    <Line
                      type="monotone"
                      dataKey="cumForecast"
                      stroke="#3b82f6"
                      dot={false}
                      name="Projected (cumulative)"
                    />
                  </LineChart>
                </ChartWrap>
              </div>

              {forecastSummaryText && (
                <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
                  {forecastSummaryText}
                </div>
              )}
            </>
          )}
        </div>
      ) : tab === 'trend' ? (
        <div className="space-y-6">
          {/* Graph 1: Target & Actual Sales */}
          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold mb-3">
              Target &amp; Actual Sales
            </h3>
            <ChartWrap isMobile={isMobile}>
              <LineChart
                data={graphData}
                margin={
                  isMobile
                    ? { top: 8, right: 8, bottom: 0, left: 0 }
                    : { top: 10, right: 20, bottom: 0, left: 0 }
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{
                    ...axisTick,
                    angle: isMobile ? -30 : 0,
                    dy: isMobile ? 10 : 0,
                  }}
                  minTickGap={isMobile ? 10 : 28}
                />
                <YAxis
                  tickFormatter={rm}
                  tick={axisTick}
                  width={isMobile ? 64 : 92}
                />
                <Tooltip
                  labelFormatter={labelFmt}
                  wrapperStyle={{ fontSize: legendStyle.fontSize }}
                  contentStyle={{ fontSize: legendStyle.fontSize }}
                  formatter={(v, n) =>
                    n.includes('Target') || n.includes('Actual')
                      ? money(v * 100)
                      : v
                  }
                />
                <Legend wrapperStyle={legendStyle} />
                <Line
                  type="monotone"
                  dataKey="Actual"
                  stroke="#10b981"
                  dot={false}
                  name="Actual Sales (RM)"
                />
                <Line
                  type="monotone"
                  dataKey="Target"
                  stroke="#9ca3af"
                  dot={false}
                  name="Daily Target (RM)"
                />
              </LineChart>
            </ChartWrap>
          </div>

          {/* Graph 2: Sales GAP */}
          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold mb-3">
              Sales GAP (Target − Actual)
            </h3>
            <ChartWrap isMobile={isMobile}>
              <LineChart
                data={graphData}
                margin={
                  isMobile
                    ? { top: 8, right: 8, bottom: 0, left: 0 }
                    : { top: 10, right: 20, bottom: 0, left: 0 }
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={axisTick}
                  minTickGap={isMobile ? 10 : 28}
                />
                <YAxis
                  tickFormatter={rm}
                  tick={axisTick}
                  width={isMobile ? 64 : 92}
                />
                <Tooltip
                  labelFormatter={labelFmt}
                  wrapperStyle={{ fontSize: legendStyle.fontSize }}
                  contentStyle={{ fontSize: legendStyle.fontSize }}
                  formatter={(v) => money(v * 100)}
                />
                <Legend wrapperStyle={legendStyle} />
                <Line
                  type="monotone"
                  dataKey="Gap"
                  stroke="#f59e0b"
                  dot={false}
                  name="GAP (RM)"
                />
              </LineChart>
            </ChartWrap>
          </div>

          {/* Graph 3: New Contacts & Opportunities */}
          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold mb-3">
              New Contacts &amp; Opportunities
            </h3>
            <ChartWrap isMobile={isMobile}>
              <BarChart
                data={graphData}
                margin={
                  isMobile
                    ? { top: 8, right: 8, bottom: 0, left: 0 }
                    : { top: 10, right: 20, bottom: 0, left: 0 }
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={axisTick} />
                <YAxis
                  yAxisId="left"
                  allowDecimals={false}
                  tick={axisTick}
                  width={isMobile ? 40 : 46}
                />
                <Tooltip
                  labelFormatter={labelFmt}
                  wrapperStyle={{ fontSize: legendStyle.fontSize }}
                  contentStyle={{ fontSize: legendStyle.fontSize }}
                />
                <Legend wrapperStyle={legendStyle} />
                <Bar
                  yAxisId="left"
                  dataKey="NewContacts"
                  name="New Contacts"
                  fill="#60A5FA"
                />
                <Bar
                  yAxisId="left"
                  dataKey="Opportunities"
                  name="Opportunities"
                  fill="#34D399"
                />
              </BarChart>
            </ChartWrap>
            <div className="text-xs text-gray-500 mt-2">
              Line charts = RM; bar chart = counts.
            </div>
          </div>
        </div>
      ) : (
        /* CONVERSIONS */
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <CardStat
              title="Prospect → Deal"
              value={`${conv?.prospectToDeal?.count || 0} (${pctNumber(
                conv?.prospectToDeal?.count,
                conv?.prospectToDeal?.totalNewOpps
              )}%)`}
            />
            <CardStat
              title="Deal → Outcome"
              value={`${conv?.dealToOutcome?.count || 0} (${pctNumber(
                conv?.dealToOutcome?.count,
                conv?.dealToOutcome?.totalDeals
              )}%)`}
            />
            <CardStat
              title="Win Rate"
              value={`${conv?.winRate?.countWon || 0} (${pctNumber(
                conv?.winRate?.countWon,
                conv?.winRate?.totalNewOpps
              )}%)`}
            />
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold mb-3">
              Top Stage Transitions
            </h3>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th>Count</Th>
                </tr>
              </thead>
              <tbody>
                {(conv?.topStageMoves || []).map((x, i) => (
                  <tr key={i} className="border-t">
                    <Td>{x.from}</Td>
                    <Td>{x.to}</Td>
                    <Td>{x.count}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold mb-3">
              Category Transitions
            </h3>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th>Count</Th>
                </tr>
              </thead>
              <tbody>
                {(conv?.categoryMoves || []).map((x, i) => (
                  <tr key={i} className="border-t">
                    <Td>{x.from}</Td>
                    <Td>{x.to}</Td>
                    <Td>{x.count}</Td>
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

/* ===== Small components & helpers ===== */

function Kpi({ title, value, strong, valueClass }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div
        className={cls(
          'mt-1 text-2xl tracking-tight',
          strong ? 'font-bold' : 'font-semibold',
          valueClass
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="text-left p-2 border-b font-medium text-gray-600">
      {children}
    </th>
  );
}
function Td({ children, className }) {
  return <td className={cls('p-2', className)}>{children}</td>;
}
function sum(arr, k) {
  return (arr || []).reduce((s, x) => s + Number(x?.[k] || 0), 0);
}
function rm(v) {
  return `RM${Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ChartWrap({ children, isMobile }) {
  return (
    <div className="w-full" style={{ height: isMobile ? 260 : 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function CardStat({ title, value, hint }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="mt-1 text-2xl tracking-tight font-semibold">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

// simple hook reused from TeamPerformance-style behaviour
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}

// Rule-based summary text for forecast
function getForecastSummaryText(forecast) {
  if (!forecast || !forecast.available) return '';

  const pct = Math.round(forecast.projectedAchievementPct || 0);
  const isMonthly = forecast.mode === 'monthly';
  const periodPhrase = isMonthly
    ? "this month’s target"
    : 'this forecast period';

  let base = '';

  if (pct >= 105) {
    base = `The team is on track to exceed ${periodPhrase}. Consider doubling down on the activities that are working best.`;
  } else if (pct >= 90) {
    base = `The team is roughly on track to hit ${periodPhrase}. Maintain the current pace and monitor daily performance.`;
  } else if (pct >= 70) {
    base = `At the current pace, the team is likely to fall slightly short of ${periodPhrase}. Focus on increasing daily sales activity and follow-ups.`;
  } else {
    base = `The team is significantly behind ${periodPhrase} at the current pace. You may need more new contacts, more opportunities, or a higher average deal size to get back on track.`;
  }

  const gapCents = isMonthly
    ? forecast.remainingToTargetCents
    : forecast.expectedGapCents;

  let extra = '';
  if (gapCents > 0 && (forecast.contactsNeeded || forecast.oppsNeeded)) {
    const parts = [];
    if (forecast.contactsNeeded) {
      parts.push(`${Math.round(forecast.contactsNeeded)} more contacts`);
    }
    if (forecast.oppsNeeded) {
      parts.push(`${Math.round(forecast.oppsNeeded)} more opportunities`);
    }
    if (parts.length) {
      extra = ` To close the gap for ${
        isMonthly ? 'this month' : 'this period'
      }, the team needs approximately ${parts.join(
        ' or '
      )} at the current performance level.`;
    }
  }

  return base + extra;
}

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

  const safeScope = String(scopeLabel || 'team')
    .toLowerCase()
    .replace(/\s+/g, '-');
  const fileName = `manager-performance-${safeScope}-${from || 'from'}_to_${
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
