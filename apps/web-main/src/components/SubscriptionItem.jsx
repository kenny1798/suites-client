import React from 'react';
import { apiAuth } from '@suite/api-clients';

const pill = (status) => {
  const map = {
    active: 'bg-emerald-100 text-emerald-800',
    trialing: 'bg-blue-100 text-blue-800',
    canceled: 'bg-slate-100 text-slate-700',
    expired: 'bg-amber-100 text-amber-800',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
};

export default function SubscriptionItem({ subscription }) {
  const [loading, setLoading] = React.useState(false);

  const cancel = async () => {
    if (!window.confirm('Cancel this subscription?')) return;
    setLoading(true);
    try {
      await apiAuth.post(`/billing/tool-subscriptions/${subscription.id}/cancel`);
      window.location.reload();
    } catch (e) {
      alert(e?.response?.data?.error || 'Cancel failed');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-4 flex items-start justify-between">
      <div>
        <div className="font-semibold">{subscription?.Tool?.name || subscription.toolId}</div>
        <div className="text-sm text-slate-600">Plan: {subscription?.Plan?.name || subscription.planCode}</div>
        <div className="mt-1">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${pill(subscription.status)}`}>
            {subscription.status}
          </span>
          {subscription.trialEnd && (
            <span className="text-xs text-slate-500 ml-2">
              Trial ends {new Date(subscription.trialEnd).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {subscription.status === 'active' && (
          <button
            onClick={cancel}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? 'Canceling…' : 'Cancel'}
          </button>
        )}
        {/* Plan change happens on billing page via picker you already built */}
      </div>
    </div>
  );
}
