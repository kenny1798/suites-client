// packages/salestrack/src/ui/opps/OpportunityCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatLocalDateTime } from '../../utils/datetime.js';
import { getContrastingTextColor } from '../../utils/color.js';
import { combinePhone } from '../../utils/combinePhone.js';


export default function OpportunityCard({
  opp,
  statusColor,
  statusName,
  contactName,
  valueFmt,
  onDelete,
  onRestore,
  mode = 'active',
}) {

  const { display: phoneDisplay, digits: phoneDigits } =
     combinePhone(opp?.Contact?.phonecc, opp?.Contact?.phone);
  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onDelete === 'function') onDelete(opp);
  };

  const bg = statusColor || '#E5E7EB';
  const fg = getContrastingTextColor(statusColor);
  const pillStyle = { background: bg, color: fg };

  return (    
    <Link
      to={mode === 'deleted' ? '#' : `/salestrack/opportunities/${opp.id}`}
      onClick={e => mode === 'deleted' && e.preventDefault()}
      className="block rounded-xl border bg-white p-4 hover:bg-gray-50 transition relative"
    >
      {/* MOBILE delete (absolute, only < md) */}
      {mode === 'deleted' && typeof onRestore === 'function' && (
            <button
              onClick={(e)=>{e.preventDefault(); e.stopPropagation(); onRestore?.(opp);}}
              title="Restore"
              className="absolute top-2 right-2 z-10 inline-flex h-8 px-2 items-center justify-center rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50 md:hidden"
            >
              Restore
            </button>
          )}
          
          {mode === 'active' && (
            <button
            onClick={handleDelete}
            title="Delete opportunity"
            aria-label="Delete opportunity"
            className="absolute top-2 right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600 md:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 6h18M9 6V4h6v2m-8 0h10l-1 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 6Z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          )}



      {/* Header */}
      <div className="grid grid-cols-1 md:flex md:items-start md:justify-between gap-3 pr-12 md:pr-0">
        {/* Left: title + contact */}
        <div className="min-w-0">
          <div className="truncate font-medium text-gray-900">{opp.name}</div>
          <div className="text-sm text-gray-500 truncate">
            {contactName ? `Contact: ${contactName}` : 'No contact'}
            {phoneDisplay && (
              <div className="text-sm text-gray-500 truncate">
                📱 {phoneDisplay}
                </div>
                )}
          </div>
        </div>

        {/* Right: value + status + (desktop delete inline) */}
        <div className="flex items-start justify-end gap-2 md:gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold">{valueFmt}</div>
            <div
              className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={pillStyle}
            >
              {statusName || '—'}
            </div>
          </div>

          {/* DESKTOP delete (inline, only md+) */}
          {mode === 'deleted' && typeof onRestore === 'function' && (
            <button
              onClick={(e)=>{e.preventDefault(); e.stopPropagation(); onRestore?.(opp);}}
              title="Restore"
              className="hidden md:inline-flex h-8 px-2 items-center justify-center  rounded-md border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              Restore
            </button>
          )}  
          {mode === 'active' && (
          <button
            onClick={handleDelete}
            title="Delete opportunity"
            aria-label="Delete opportunity"
            className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 6h18M9 6V4h6v2m-8 0h10l-1 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 6Z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        </div>
      </div>

      {/* Footer: created at (browser timezone) */}
      <div className="mt-3 flex items-center justify-end">
        <div className="text-xs text-gray-400">
          {mode === 'deleted' ? `Deleted: ${new Date(opp.deletedAt).toLocaleString()}` : `Created: ${new Date(opp.createdAt).toLocaleString()}`}
        </div>
      </div>
    </Link>
  );
}
