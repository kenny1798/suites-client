import React from 'react';
import { useTeam } from '@suite/core-context';

export default function TeamReportsPage() {
  const { activeTeam } = useTeam();
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-xl font-semibold">Team Reports</h1>
      <div className="text-sm text-gray-600">Team: {activeTeam?.name || '—'}</div>
      <div className="border rounded-xl p-6 bg-white">
        <div className="text-gray-500 text-sm">Charts & tables coming soon.</div>
      </div>
    </div>
  );
}
