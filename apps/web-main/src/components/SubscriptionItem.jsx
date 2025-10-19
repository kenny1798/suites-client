// Cipta fail baru: src/components/SubscriptionItem.jsx

import React from 'react';

// Helper untuk format tarikh
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

// Helper untuk dapatkan warna badge
const getStatusBadge = (status) => {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'trialing': return 'bg-sky-100 text-sky-800';
    case 'past_due': return 'bg-amber-100 text-amber-800';
    case 'canceled': return 'bg-slate-100 text-slate-800';
    default: return 'bg-slate-100 text-slate-800';
  }
};

// Helper untuk dapatkan label tarikh
const getDateLabel = (status, date) => {
  switch (status.toLowerCase()) {
    case 'active': return `Renews on ${formatDate(date)}`;
    case 'trialing': return `Trial ends on ${formatDate(date)}`;
    case 'canceled': return `Expires on ${formatDate(date)}`;
    case 'past_due': return `Payment due on ${formatDate(date)}`;
    default: return `Ends on ${formatDate(date)}`;
  }
};

export default function SubscriptionItem({ subscription }) {
  const { Plan: plan, Tool: tool, status, currentPeriodEnd, trialEnd } = subscription;
  const priceInRM = (plan?.priceCents / 100).toFixed(2);

  // Utamakan tarikh tamat trial jika ada
  const relevantDate = trialEnd || currentPeriodEnd;

  return (
    <div className="p-4 bg-white rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-slate-100 text-xl">
          {tool?.icon || '📦'}
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">{tool?.name || 'Unknown Tool'}</h3>
          <p className="text-sm text-slate-500">
            {plan?.name || 'Unknown Plan'} • RM{priceInRM} / {plan?.interval}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-right w-full sm:w-auto">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(status)}`}>
          {status}
        </span>
        <span className="text-slate-600 flex-shrink-0">
          {getDateLabel(status, relevantDate)}
        </span>
      </div>
    </div>
  );
}