import React from 'react';
import { startOfToday, endOfToday, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export function DateRangePresets({ setStartDate, setEndDate }) {
  const presets = [
    { label: 'Today', action: () => { setStartDate(startOfToday()); setEndDate(endOfToday()); } },
    { label: 'Yesterday', action: () => { const y = subDays(new Date(), 1); setStartDate(y); setEndDate(y); } },
    { label: 'Last 7 days', action: () => { setStartDate(subDays(new Date(), 6)); setEndDate(endOfToday()); } },
    { label: 'This Month', action: () => { setStartDate(startOfMonth(new Date())); setEndDate(endOfToday()); } },
  ];

  return (
    <div className="flex items-center gap-2">
      {presets.map(p => (
        <button
          key={p.label}
          onClick={p.action}
          className="px-3 py-1 text-sm bg-white border rounded-md hover:bg-slate-50"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}