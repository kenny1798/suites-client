// packages/salestrack/src/ui/opps/OpportunityCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function OpportunityCard({ opp, statusColor, statusName, contactName, valueFmt }) {
  return (
    <Link
      to={`/salestrack/opportunities/${opp.id}`}
      className="block rounded-xl border bg-white p-4 hover:bg-gray-50 transition"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium text-gray-900">{opp.name}</div>
          <div className="text-sm text-gray-500 truncate">
            {contactName ? `Contact: ${contactName}` : 'No contact'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">{valueFmt}</div>
          <div
            className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs"
            style={{ background: statusColor || '#E5E7EB' }}
          >
            {statusName || '—'}
          </div>
        </div>
      </div>
    </Link>
  );
}
