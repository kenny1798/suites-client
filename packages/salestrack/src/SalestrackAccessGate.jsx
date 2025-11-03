// packages/salestrack/src/SalestrackAccessGate.jsx
import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { TeamProvider, useTeam } from '@suite/core-context';
import { useAuth } from '@suite/auth';
import { useMySubs } from '@suite/hooks';
import { toolsApi } from '@suite/api-clients';
import SalesTrackInitializer from './pages/SalesTrackInitializer.jsx';
import { useSalestrackTeamAccess } from './hooks/useSalestrackTeamAccess';

const STORE_PATH = '/store?tool=salestrack';
const RENEW_PATH = '/billing/renew/salestrack';

/** Small helper banner that auto-switches to another team (if any) after 4s,
 * otherwise returns to Suite home. Wrapped in TeamProvider at render site. */
function AccessPausedAutoSwitch() {
  const navigate = useNavigate();
  const { teams = [], activeTeam, switchTeam, activeToolSlug } = useTeam() || {};

  // tool slug TeamProvider detect dari URL (untuk SalesTrack ia sepatutnya 'salestrack')
  const toolSlug = activeToolSlug || 'salestrack';

  const nextTeam = React.useMemo(() => {
    const arr = Array.isArray(teams) ? teams : [];
    if (!arr.length) return null;
    const curId = activeTeam?.id;
    return arr.find(t => t?.id && t.id !== curId) || null;
  }, [teams, activeTeam]);

  const persist = (id) => {
    try { localStorage.setItem(`activeTeamId_${toolSlug}`, String(id)); } catch {}
  };

  const doSwitchNow = React.useCallback(() => {
    if (nextTeam?.id) {
      // 1) tukar dalam context
      if (typeof switchTeam === 'function') switchTeam(nextTeam.id);
      // 2) persist untuk remount berikutnya
      persist(nextTeam.id);
      // 3) bagi React settle, lepas tu hard reload supaya AccessGate re-evaluate
      setTimeout(() => window.location.reload(), 150);
    } else {
      navigate('/', { replace: true });
    }
  }, [nextTeam, switchTeam, navigate, toolSlug]);

  React.useEffect(() => {
    const t = setTimeout(doSwitchNow, 4000);
    return () => clearTimeout(t);
  }, [doSwitchNow]);

  return (
    <div className="p-8">
      <div className="max-w-lg mx-auto border rounded-xl p-6 bg-white text-center">
        <div className="text-lg font-semibold text-gray-900">Access Paused</div>
        <p className="text-sm text-gray-600 mt-2">
          Your team's subscription for SalesTrack has expired or is unpaid. Please inform the team owner to renew so that access can be reactivated.
        </p>
        <div className="mt-3 text-xs text-gray-500">
          {nextTeam?.name
            ? <>Switching to <b>{nextTeam.name}</b> in 4 seconds…</>
            : <>Returning to Suite in 4 seconds…</>}
        </div>
        <div className="mt-4">
          <button
            onClick={doSwitchNow}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800"
          >
            {nextTeam?.id ? 'Switch now' : 'Go now'}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function SalestrackAccessGate({ children, onResolved }) {
  const { user, loading: authLoading, entitlementsFor } = useAuth();
  const { loading: subsLoading, map: subsMap } = useMySubs(); // truth for direct sub
  const location = useLocation();

  // Entitlement aggregate (may include inherited)
  const st = entitlementsFor?.('salestrack') || null;
  const hasEntitlement = !!st;
  const toCode = (x) => (x ?? '').toString().trim().toLowerCase();

  // Direct subscription status (truth)
  const mySub = subsMap?.['salestrack'] || null;
  const directStatus = toCode(mySub?.status);
  const hasDirect = !!mySub;
  const isDirectActive = ['active', 'trialing'].includes(directStatus);
  const isDirectExpiredLike = ['expired','canceled','past_due','barred'].includes(directStatus);

  // Teams (counts + setup)
  const [teams, setTeams] = React.useState(null);
  const [teamsLoading, setTeamsLoading] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) { setTeams([]); return; }
      setTeamsLoading(true);
      try {
        const res = await toolsApi.get('/api/salestrack/teams', { timeout: 15000 });
        if (!alive) return;
        setTeams(Array.isArray(res?.data) ? res.data : []);
      } catch {
        if (alive) setTeams([]);
      } finally {
        if (alive) setTeamsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user]);

  const { teamsCount, ownedTeamCount, isOwnerSomewhere } = React.useMemo(() => {
    const arr = Array.isArray(teams) ? teams : [];
    const isOwner = (t) => t?.role ? t.role === 'OWNER' : (t?.TeamMembers?.[0]?.role === 'OWNER');
    const owned = arr.filter(isOwner).length;
    return { teamsCount: arr.length, ownedTeamCount: owned, isOwnerSomewhere: owned > 0 };
  }, [teams]);

  // Team-aware access (for members)
  const { canUseThisTeam, myRole } = useSalestrackTeamAccess();

  // Summary up to Shell (for banner / create-team CTA)
  React.useEffect(() => {
    if (typeof onResolved === 'function') {
      const ready = !authLoading && !teamsLoading && !subsLoading;
      if (user && ready) {
        // We also infer entitlement active (for completeness)
        const entStatus = toCode(st?.status);
        const entActive = ['active','trialing'].includes(entStatus);

        onResolved({
          subActive: entActive,
          teamsCount,
          ownedTeamCount,
          isOwnerSomewhere,
          hasDirectSubActive: isDirectActive,
        });
      }
    }
  }, [
    user, authLoading, teamsLoading, subsLoading,
    st, teamsCount, ownedTeamCount, isOwnerSomewhere, isDirectActive, onResolved
  ]);

  const isLoading = authLoading || teamsLoading || subsLoading;

  // Gate decisions
  const decision = React.useMemo(() => {
    if (!user) return { kind: 'LOGIN' };
    if (isLoading) return { kind: 'LOADING' };

    // OWNER (or no team at all): must have direct sub
    if (myRole === 'OWNER' || (!myRole && teamsCount === 0)) {
      if (!hasDirect) return { kind: 'NAVIGATE', to: STORE_PATH };
      if (isDirectExpiredLike) return { kind: 'NAVIGATE', to: RENEW_PATH };
      if (isDirectActive && teamsCount === 0) return { kind: 'SETUP' };
    }

    // MEMBER with only inherited entitlement → Access Paused (no redirect)
    if (hasEntitlement && !hasDirect) {
      return { kind: 'BLOCK_MEMBER', reason: 'inherited_only' };
    }

    // MEMBER of a team that isn't usable → Access Paused
    if (myRole && myRole !== 'OWNER' && !canUseThisTeam) {
      return { kind: 'BLOCK_MEMBER', reason: 'team_not_valid' };
    }

    // Has any team → allow
    if (teamsCount > 0) return { kind: 'ALLOW' };

    // No entitlement at all → Store
    if (!hasEntitlement) return { kind: 'NAVIGATE', to: STORE_PATH };

    return { kind: 'NAVIGATE', to: STORE_PATH };
  }, [
    user, isLoading, myRole, teamsCount,
    hasDirect, isDirectActive, isDirectExpiredLike,
    hasEntitlement, canUseThisTeam
  ]);

  // Render branches
  if (decision.kind === 'LOADING') {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto border rounded-xl p-6 bg-white">
          <div className="text-gray-800 font-medium">Checking your access…</div>
          <div className="text-gray-500 text-sm mt-1">Verifying entitlements and team status.</div>
        </div>
      </div>
    );
  }

  if (decision.kind === 'LOGIN') {
    const ret = encodeURIComponent(location.pathname + location.search + location.hash);
    return <Navigate to={`/login?returnTo=${ret}`} replace />;
  }

  if (decision.kind === 'NAVIGATE') {
    return <Navigate to={decision.to} replace state={{ from: location }} />;
  }

  if (decision.kind === 'SETUP') {
    return <SalesTrackInitializer />;
  }

  // BLOCK_MEMBER → show Access Paused + auto-switch after 4s.
  if (decision.kind === 'BLOCK_MEMBER') {
    return (
      <TeamProvider>
        <AccessPausedAutoSwitch />
      </TeamProvider>
    );
  }

  // ALLOW → mount Team context
  return <TeamProvider>{children}</TeamProvider>;
}
