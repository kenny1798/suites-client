import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { TeamProvider } from '@suite/core-context';
import { useAuth } from '@suite/auth';
import { useMySubs } from '@suite/hooks';
import { toolsApi } from '@suite/api-clients';
import SalesTrackInitializer from './pages/SalesTrackInitializer';

// tweak to your app routes
const STORE_PATH = '/store?tool=salestrack';
const RENEW_PATH = '/billing/renew/salestrack';

export default function SalestrackAccessGate({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { loading: subLoading, sub } = useMySubs('salestrack'); // { status, portalUrl? }
  const [teams, setTeams] = useState(null); // array or null while loading
  const [teamsLoading, setTeamsLoading] = useState(false);
  const location = useLocation();

  const subStatus  = (sub?.status || '').toLowerCase();          // 'active' | 'trialing' | 'past_due' | 'expired' | ...
  const subActive  = subStatus === 'active' || subStatus === 'trialing';

  // 🔎 always fetch teams (whether owner or member)
  useEffect(() => {
    let alive = true;
    async function run() {
      console.log('sub', sub)
      console.log('subStatus', subStatus)
      console.log('subActive', subActive)
      if (!user) { setTeams([]); return; }
      setTeamsLoading(true);
      try {
        const res = await toolsApi.get('/api/salestrack/teams');
        if (!alive) return;
        const arr = Array.isArray(res?.data) ? res.data : [];
        setTeams(arr);
      } catch (e) {
        // if API says forbidden → treat as 0 teams
        if (alive) setTeams([]);
      } finally {
        if (alive) setTeamsLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [user]);

  const isLoading = authLoading || subLoading || teamsLoading;

  // derive quick flags from teams result
  const { teamsCount, isOwnerSomewhere } = useMemo(() => {
    const count = Array.isArray(teams) ? teams.length : 0;
    const owner = Array.isArray(teams)
      ? teams.some(t => (t.TeamMembers?.[0]?.role || t.role) === 'OWNER')
      : false;
    return { teamsCount: count, isOwnerSomewhere: owner };
  }, [teams]);

  // Debug (optional)
  if (typeof window !== 'undefined') {
    console.debug('[SalestrackGate]', { subStatus, subActive, teamsCount, isOwnerSomewhere });
  }

  const decision = useMemo(() => {
    if (!user) return { kind: 'LOGIN' };
    if (isLoading) return { kind: 'LOADING' };

    // ── Owner with problematic sub → push to renew
    if ((subStatus === 'expired' || subStatus === 'past_due') && isOwnerSomewhere) {
      if (sub?.portalUrl) return { kind: 'REDIRECT', to: sub.portalUrl, external: true };
      return { kind: 'NAVIGATE', to: RENEW_PATH };
    }

    // ── Owner with active sub, but has no team yet → setup wizard
    if (subActive && teamsCount === 0) return { kind: 'SETUP' };

    // ── If member of any team (owner/admin/manager/rep) → allow
    if (teamsCount > 0) return { kind: 'ALLOW' };

    // ── No team & no active sub → to store
    return { kind: 'NAVIGATE', to: STORE_PATH };
  }, [user, isLoading, subStatus, subActive, teamsCount, isOwnerSomewhere, sub?.portalUrl]);

  // ── Render
  if (decision.kind === 'LOADING') {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto border rounded-xl p-6 bg-white">
          <div className="text-gray-800 font-medium">Checking your access…</div>
          <div className="text-gray-500 text-sm mt-1">Verifying subscription and team status.</div>
        </div>
      </div>
    );
  }

  if (decision.kind === 'LOGIN') {
    const ret = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${ret}`} replace />;
  }

  if (decision.kind === 'NAVIGATE') {
    return <Navigate to={decision.to} replace state={{ from: location }} />;
  }

  if (decision.kind === 'REDIRECT') {
    if (typeof window !== 'undefined') window.location.href = decision.to;
    return null;
  }

  if (decision.kind === 'SETUP') {
    return <SalesTrackInitializer />;
  }

  // ALLOW → mount TeamProvider and show children
  return <TeamProvider>{children}</TeamProvider>;
}
