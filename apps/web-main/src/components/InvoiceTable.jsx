import React from 'react';
import InvoiceRow from './InvoiceRow.jsx';

export default function InvoiceTable({ loading, error, invoices, onRefetch }) {
  if (loading) return <div className="text-slate-500">Loading invoices…</div>;
  if (error) return <div className="text-rose-600">Failed to load invoices.</div>;

  if (!invoices?.length) {
    return <div className="text-slate-500">You have no invoices yet.</div>;
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Amount</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {invoices.map(inv => (
            <InvoiceRow key={inv.id} inv={inv} onPaid={onRefetch} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
