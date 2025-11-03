import React from 'react';
import { apiAuth } from '@suite/api-clients';

const money = (cents=0) => `RM ${(cents/100).toFixed(2)}`;

export default function InvoiceRow({ inv, onPaid }) {
  const [paying, setPaying] = React.useState(false);

  const pay = async () => {
    setPaying(true);
    try {
      const { data } = await apiAuth.post(`/billing/invoices/${inv.id}/pay`);
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert('Unable to open Stripe checkout.');
        setPaying(false);
      }
    } catch (e) {
      alert(e?.response?.data?.error || 'Payment init failed');
      setPaying(false);
    }
  };

  const statusPill = (s) => {
    const map = {
      paid: 'bg-emerald-100 text-emerald-800',
      open: 'bg-indigo-100 text-indigo-800',
      unpaid: 'bg-rose-100 text-rose-800',
      draft: 'bg-slate-100 text-slate-700',
      void: 'bg-slate-100 text-slate-500',
    };
    return map[s] || 'bg-slate-100 text-slate-700';
  };

  return (
    <tr>
      <td className="px-4 py-3 text-sm text-slate-700">{new Date(inv.issuedAt).toLocaleDateString()}</td>
      <td className="px-4 py-3 text-sm text-slate-700">{money(inv.totalCents)}</td>
      <td className="px-4 py-3 text-sm">
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusPill(inv.status)}`}>
          {inv.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {inv.status !== 'paid' && inv.totalCents > 0 ? (
          <button
            onClick={pay}
            disabled={paying}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {paying ? 'Processing…' : 'Pay'}
          </button>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        )}
      </td>
    </tr>
  );
}
