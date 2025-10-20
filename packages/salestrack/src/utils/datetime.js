// packages/salestrack/src/lib/datetime.js
export const fmtLocal = new Intl.DateTimeFormat('en-MY', {
    dateStyle: 'medium',
    timeStyle: 'short', // contoh: 24 Feb 2025, 3:41 PM
    // timeZone tak perlu set — default guna timezone browser (user)
  });
  
  export function formatLocalDateTime(isoLike) {
    if (!isoLike) return '-';
    const d = new Date(isoLike);
    return isNaN(d) ? '-' : fmtLocal.format(d);
  }
  