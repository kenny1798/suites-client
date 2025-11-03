import React from 'react';
import { apiAuth } from '@suite/api-clients';

export default function CancelPlanModal({
  open,
  onClose,
  toolName,
  toolId,
  currentPlan,
  status,            // 'active' | 'trialing' | ...
  cancelAt,
  onCanceled,
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [when, setWhen] = React.useState('now'); // 'now' | 'period_end'
  const isTrial = String(status || '').toLowerCase() === 'trialing';

  React.useEffect(() => {
    setError(null);
    if (String(status).toLowerCase() === 'trialing') {
      setWhen('now');
    } else {
      const futureCancel = cancelAt && new Date(cancelAt) > new Date();
      setWhen(isTrial ? 'now' : (futureCancel ? 'period_end' : 'now'));
    }
  }, [open, status, cancelAt, isTrial]);

  if (!open) return null;

  const copy = React.useMemo(() => {
    if (isTrial) {
      return {
        title: 'Cancel Trial',
        desc: (
          <>
            You’re about to cancel your <b>{toolName}</b> trial
            <span className="text-slate-700"> ({currentPlan})</span>. This will end access immediately.
          </>
        ),
        note: 'No charges or credits apply to trial cancellations.',
      };
    }
    // ACTIVE
    return {
      title: 'Cancel Subscription',
      desc: (
        <>
          Are you sure you want to cancel your <b>{toolName}</b>
          <span className="text-slate-700"> ({currentPlan})</span> plan?
        </>
      ),
      note:
        when === 'now'
          ? 'Cancelling now ends access immediately and applies a prorated credit for the remaining days in the current cycle.'
          : 'Cancelling at period end keeps access until the end of the current billing cycle. No immediate credit will be applied.',
    };
  }, [isTrial, toolName, currentPlan, when]);

  const handleCancel = async () => {
    if (!toolId) return;
    setBusy(true);
    setError(null);
    try {
      const body = isTrial ? { toolId } : { toolId, when };
      const res = await apiAuth.post('/billing/cancel-plan', body);
      if (res.data?.success) {
        onCanceled?.(res.data);
        onClose();
      } else {
        setError(res.data?.message || res.data?.error || 'Failed to cancel.');
      }
    } catch (err) {
      const code = err?.response?.data?.error;
      if (code === 'INVOICE_LOCKED') {
        // Cadangan automatik bila user sedang checkout
        setError(
          'Payment is in progress for this cycle. You can cancel at the end of the period instead.'
        );
        setWhen('period_end');
      } else if (code === 'INVALID_STATUS') {
        setError('This subscription status cannot be cancelled.');
      } else {
        setError(err?.response?.data?.message || err?.message || 'Failed to cancel.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800">{copy.title}</h3>
          <p className="text-slate-600 mt-1">{copy.desc}</p>
        </div>

        {/* When selector (hide for trial) */}
        {!isTrial && (
          <div className="mb-4 rounded-lg border border-slate-200 p-3">
            <div className="text-sm font-medium text-slate-700 mb-2">When to cancel</div>
            <div className="space-y-2">
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  name="cancel_when"
                  value="now"
                  checked={when === 'now'}
                  onChange={() => setWhen('now')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-medium text-slate-800">Cancel now</div>
                  <div className="text-xs text-slate-600">
                    End access immediately and apply prorated credit for remaining days in this cycle.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  name="cancel_when"
                  value="period_end"
                  checked={when === 'period_end'}
                  onChange={() => setWhen('period_end')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-medium text-slate-800">End at period end</div>
                  <div className="text-xs text-slate-600">
                    Keep access until the end of the current billing cycle. No immediate credit.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Note */}
        <div className="mb-3 text-xs text-slate-600">{copy.note}</div>

        {/* Error */}
        {error && (
          <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-md px-4 py-2 text-slate-700 border border-slate-300 hover:bg-slate-50"
          >
            Keep Plan
          </button>
          <button
            onClick={handleCancel}
            disabled={busy}
            className={`rounded-md px-4 py-2 font-semibold text-white ${
              busy ? 'bg-rose-400' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {busy ? 'Canceling…' : isTrial ? 'Cancel Trial' : (when === 'now' ? 'Cancel Now' : 'Cancel at Period End')}
          </button>
        </div>
      </div>
    </div>
  );
}
