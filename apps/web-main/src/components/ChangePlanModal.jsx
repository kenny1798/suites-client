import React from 'react';
import { apiAuth } from '@suite/api-clients';
import { useToolDetails } from '../hooks/useToolDetails';

const money = (c) => `RM ${(Number(c || 0) / 100).toFixed(2)}`;

export default function ChangePlanModal({ open, onClose, toolSlug, currentSub, onSwitched }) {
  const { loading, data: tool, error } = useToolDetails(toolSlug);
  const [busy, setBusy] = React.useState(null);
  const [msg, setMsg] = React.useState(null);
  const [err, setErr] = React.useState(null);

  const currentPrice = React.useMemo(() => Number(currentSub?.Plan?.priceCents ?? 0), [currentSub]);

  const plans = React.useMemo(() => {
    if (!tool?.plans) return [];
    return tool.plans
      .filter(p => p.interval === 'month')
      .sort((a, b) => a.priceCents - b.priceCents);
  }, [tool]);

  if (!open) return null;

  const switchPlan = async (planCode) => {
    if (!planCode || planCode === currentSub?.planCode) return;
    setErr(null); setMsg(null); setBusy(planCode);
    try {
      const { data } = await apiAuth.post('/billing/switch-plan', { toolId: toolSlug, planCode });
      onSwitched?.(data);
      onClose();
    } catch (e) {
      const code = e?.response?.data?.error;
      if (code === 'UNPAID_INVOICE') setErr('You have outstanding invoices. Please settle them first.');
      else if (code === 'INVOICE_LOCKED') setErr('Current invoice is locked for payment.');
      else if (code === 'COOLDOWN_ACTIVE') setErr('Please wait 60 seconds before switching plan again.');
      else if (code === 'SWITCH_LIMIT_REACHED') setErr('Daily plan switch limit reached (3/day).');
      else if (code === 'INVALID_STATUS') setErr('This subscription status does not allow switching.');
      else if (code === 'PLAN_NOT_FOUND') setErr('Selected plan is not available.');
      else window.location.href = `/store?tool=${toolSlug}`;
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Change Plan — {tool?.name || toolSlug}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>

        {err && (
          <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 text-sm">
            {err}
          </div>
        )}
        {msg && (
          <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 text-sm">
            {msg}
          </div>
        )}

        {loading && <div className="p-4">Loading plans…</div>}
        {error && <div className="p-4 text-rose-600">Failed to load plans: {String(error)}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {plans.map((p) => {
              const isCurrent   = currentSub?.planCode === p.code;
              const isUpgrade   = Number(p.priceCents) > currentPrice;
              const isDowngrade = Number(p.priceCents) < currentPrice;

              return (
                <div
                  key={p.code}
                  className={`flex h-full flex-col rounded-lg border p-4 ${
                    isCurrent ? 'border-blue-600 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  {/* header */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="font-medium">{p.name}</div>
                    <div className="flex items-center gap-2">
                      {isCurrent && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                          Current
                        </span>
                      )}
                      {!isCurrent && isUpgrade && (
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                          Upgrade
                        </span>
                      )}
                      {!isCurrent && isDowngrade && (
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                          Downgrade
                        </span>
                      )}
                    </div>
                  </div>

                  {/* content */}
                  <div className="mb-3 text-2xl font-bold">{money(p.priceCents)}</div>
                  {!!p.trialDays && <div className="mb-3 text-sm text-slate-600">{p.trialDays} days trial</div>}
                  {isDowngrade && !isCurrent && (
                    <div className="mb-3 text-xs text-slate-600">You may lose features on downgrade.</div>
                  )}

                  {/* footer button fixed at bottom */}
                  <div className="mt-auto pt-2">
                    <button
                      disabled={isCurrent || busy === p.code}
                      onClick={() => switchPlan(p.code)}
                      className={`w-full rounded-md px-4 py-2 font-semibold ${
                        isCurrent
                          ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                          : 'bg-slate-900 text-white hover:bg-slate-700'
                      }`}
                    >
                      {isCurrent ? 'Selected' : (busy === p.code ? 'Switching…' : 'Switch to this Plan')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
