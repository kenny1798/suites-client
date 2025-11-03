// packages/salestrack/src/SalestrackShell.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import SalestrackAccessGate from './SalestrackAccessGate';
import { useAuth } from '@suite/auth';
import { useTeam } from '@suite/core-context';

export default function SalestrackShell() {
  const [gateInfo, setGateInfo] = React.useState({
    subActive: false,
    ownedTeamCount: 0,
    teamsCount: 0,
    hasDirectSubActive: false,
  });

  const { limit } = useAuth();
  const { activeTeam } = useTeam();

  // team limit ikut plan
  const teamLimitRaw = limit?.('salestrack', 'ST_TEAM_LIMIT', null);
  const teamLimit = typeof teamLimitRaw === 'number' ? teamLimitRaw : (teamLimitRaw == null ? null : Number(teamLimitRaw) || null);

  const canCreateTeam = gateInfo.hasDirectSubActive && (teamLimit == null || gateInfo.ownedTeamCount < teamLimit);

  return (
    <SalestrackAccessGate onResolved={setGateInfo}>
      <div className="p-4 sm:p-6">
        {/* 📌 Banner CTA: direct sub aktif + belum own apa-apa team */}
        {gateInfo.hasDirectSubActive && Number(gateInfo.ownedTeamCount || 0) === 0 && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
            You have an active SalesTrack subscription.{' '}
            <a className="underline font-medium" href="/salestrack/setup-my-team">
              Create my team
            </a>
            .
          </div>
        )}

        {/* Contoh card quick stats (kalau ada)—guna ownedTeamCount */}
        {/* <div className="mb-4 text-sm text-slate-700">
          Teams (owned): {gateInfo.ownedTeamCount} / {teamLimit ?? '∞'}
        </div> */}

        {/* Page content */}
        <React.Suspense fallback={<div className="p-6 text-gray-500">Loading…</div>}>
          <Outlet context={{ canCreateTeam, teamLimit, ownedTeamCount: gateInfo.ownedTeamCount }} />
        </React.Suspense>
      </div>
    </SalestrackAccessGate>
  );
}
