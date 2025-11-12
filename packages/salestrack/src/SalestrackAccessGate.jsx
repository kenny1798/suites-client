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
const RENEW_PATH = '/billing';

/** Small helper banner that lets user decide what to do when access is paused.
 * Wrapped in TeamProvider at render site. */
function AccessPausedAutoSwitch({ isOwner }) {
  const navigate = useNavigate();
  const { teams = [], activeTeam, switchTeam, activeToolSlug } = useTeam() || {};

  // tool slug TeamProvider detect dari URL (untuk SalesTrack ia sepatutnya 'salestrack')
  const toolSlug = activeToolSlug || 'salestrack';

  const nextTeam = React.useMemo(() => {
    const arr = Array.isArray(teams) ? teams : [];
    if (!arr.length) return null;
    const curId = activeTeam?.id;
    return arr.find((t) => t?.id && t.id !== curId) || null;
  }, [teams, activeTeam]);

  const persist = (id) => {
    try {
      localStorage.setItem(`activeTeamId_${toolSlug}`, String(id));
    } catch {}
  };

  const handlePrimary = React.useCallback(() => {
    // OWNER → pergi billing (manual, bukan auto)
    if (isOwner) {
      navigate(RENEW_PATH, { replace: true });
      return;
    }

    // MEMBER / MANAGER
    if (nextTeam?.id) {
      if (typeof switchTeam === 'function') switchTeam(nextTeam.id);
      persist(nextTeam.id);
      setTimeout(() => window.location.reload(), 150);
    } else {
      navigate('/', { replace: true });
    }
  }, [isOwner, nextTeam, switchTeam, navigate, toolSlug]);

  const title = 'Access Paused';
  const body = isOwner
    ? 'Your SalesTrack subscription has expired or is unpaid. Please renew your subscription to reactivate access for your team.'
    : "Your team's subscription for SalesTrack has expired or is unpaid. Please inform the team owner so that access can be reactivated.";

  const helper = isOwner
    ? "You can manage your billing when you're ready."
    : nextTeam?.name
    ? `You can switch to ${nextTeam.name} or go back to Suite.`
    : 'You can go back to Suite.';

  const primaryLabel = isOwner
    ? 'Manage billing'
    : nextTeam?.name
    ? `Switch to ${nextTeam.name}`
    : 'Back to Suite';

  return (
    <div className="p-8">
      <div className="max-w-lg mx-auto border rounded-xl p-6 bg-white text-center">
        <div className="text-lg font-semibold text-gray-900">{title}</div>
        <p className="text-sm text-gray-600 mt-2">{body}</p>
        <div className="mt-3 text-xs text-gray-500">{helper}</div>
        <div className="mt-4">
          <button
            onClick={handlePrimary}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SalestrackAccessGate({ children, onResolved }) {
  const { user, loading: authLoading, entitlementsFor } = useAuth();
  const { loading: subsLoading, map: subsMap } = useMySubs();
  const location = useLocation();

  const st = entitlementsFor?.('salestrack') || null;
  const toCode = (x) => (x ?? '').toString().trim().toLowerCase();
  const hasEntitlement = !!st;

  const entStatus = toCode(st?.status);
  const entActive = ['active', 'trialing'].includes(entStatus);
  const entExpiredLike = ['expired', 'canceled', 'past_due', 'barred'].includes(entStatus);

  // Direct subscription (biasanya OWNER saja)
  const mySub = subsMap?.['salestrack'] || null;
  const directStatus = toCode(mySub?.status);
  const hasDirect = !!mySub;
  const isDirectActive = ['active', 'trialing'].includes(directStatus);
  const isDirectExpiredLike = ['expired', 'canceled', 'past_due', 'barred'].includes(directStatus);

  // Teams (counts + setup)
  const [teams, setTeams] = React.useState(null);
  const [teamsLoading, setTeamsLoading] = React.useState(true); // start as loading

  React.useEffect(() => {
    let alive = true;

    // kalau tak login, confirm takda team
    if (!user) {
      setTeams([]);
      setTeamsLoading(false);
      return () => {
        alive = false;
      };
    }

    (async () => {
      setTeamsLoading(true);
      try {
        const res = await toolsApi.get('/api/salestrack/teams', { timeout: 15000 });
        if (!alive) return;
        setTeams(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        if (alive) setTeams([]);
      } finally {
        if (alive) setTeamsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user]);

  const { teamsCount, ownedTeamCount, isOwnerSomewhere } = React.useMemo(() => {
    const arr = Array.isArray(teams) ? teams : [];
    const isOwner = (t) =>
      t?.role ? t.role === 'OWNER' : t?.TeamMembers?.[0]?.role === 'OWNER';
    const owned = arr.filter(isOwner).length;
    return { teamsCount: arr.length, ownedTeamCount: owned, isOwnerSomewhere: owned > 0 };
  }, [teams]);

  const { canUseThisTeam, myRole } = useSalestrackTeamAccess();

  // 🔑 Derive "effectiveRole" supaya kita tak buat keputusan sebelum role settle
  const effectiveRole = React.useMemo(() => {
    // kalau hook dah bagi role, guna direct
    if (myRole) return myRole;

    // kalau teams masih loading, kita anggap belum ready
    if (teamsLoading) return null;

    // kalau langsung tak ada team → user ni solo, treat as OWNER (akan create team sendiri)
    if (teamsCount === 0) return 'OWNER';

    // ada team tapi hook belum bagi role lagi → pending
    return null;
  }, [myRole, teamsLoading, teamsCount]);

  // selagi effectiveRole null (ada team tapi role belum ready) → kekal loading
  const rolePending = effectiveRole === null;

  // Hantar summary naik atas (Dashboard shell)
  React.useEffect(() => {
    if (typeof onResolved === 'function') {
      const ready = !authLoading && !teamsLoading && !subsLoading && !rolePending;
      if (user && ready) {
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
    user,
    authLoading,
    teamsLoading,
    subsLoading,
    rolePending,
    entActive,
    teamsCount,
    ownedTeamCount,
    isOwnerSomewhere,
    isDirectActive,
    onResolved,
  ]);

  const isLoading = authLoading || teamsLoading || subsLoading || rolePending;

  console.log('SalestrackAccessGate access context:', {
    myRole,
    effectiveRole,
    canUseThisTeam,
    entStatus,
    directStatus,
    teamsCount,
  });

  const decision = React.useMemo(() => {
    if (!user) return { kind: 'LOGIN' };
    if (isLoading) return { kind: 'LOADING' };

    // OWNER (explicit atau "solo user" tanpa team)
    if (effectiveRole === 'OWNER') {
      // Owner yang langsung tak ada direct sub → ke store macam biasa
      if (!hasDirect) {
        return { kind: 'NAVIGATE', to: STORE_PATH };
      }

      // Owner tapi subscription dia expired / tak active → tunjuk Access Paused page
      if (isDirectExpiredLike || !entActive) {
        return { kind: 'BLOCK_MEMBER', reason: 'owner_subscription_inactive' };
      }

      if (isDirectActive && teamsCount === 0) {
        return { kind: 'SETUP' };
      }
      // owner + active + ada team → ALLOW via fallback bawah
    }

    // MEMBER / MANAGER (bukan owner)
    if (effectiveRole && effectiveRole !== 'OWNER') {
      // 1) Kalau team ni sendiri TAK valid untuk dia → Access Paused
      if (!canUseThisTeam) {
        const reason = !hasEntitlement
          ? 'no_entitlement'
          : entExpiredLike
          ? 'team_subscription_inactive'
          : 'team_not_valid';
        return { kind: 'BLOCK_MEMBER', reason };
      }

      // 2) Team valid, tapi entitlement global tak active/trial → tetap Access Paused
      if (!entActive) {
        const reason = !hasEntitlement
          ? 'no_entitlement'
          : entExpiredLike
          ? 'team_subscription_inactive'
          : 'team_not_active';
        return { kind: 'BLOCK_MEMBER', reason };
      }

      // 3) Team valid + entitlement active/trial → barulah boleh guna
      return { kind: 'ALLOW' };
    }

    // Fallback: ada team + ada entitlement active atau direct sub active → ALLOW
    if (teamsCount > 0 && (entActive || isDirectActive)) {
      return { kind: 'ALLOW' };
    }

    // No entitlement + no direct (sampai sini biasanya owner/solo sahaja)
    if (!hasEntitlement && !hasDirect) {
      return { kind: 'NAVIGATE', to: STORE_PATH };
    }

    // default → ke store (safety untuk owner)
    return { kind: 'NAVIGATE', to: STORE_PATH };
  }, [
    user,
    isLoading,
    effectiveRole,
    teamsCount,
    hasDirect,
    isDirectActive,
    isDirectExpiredLike,
    hasEntitlement,
    entActive,
    entExpiredLike,
    canUseThisTeam,
  ]);

  console.log('SalestrackAccessGate decision:', decision);

  if (decision.kind === 'LOADING') {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto border rounded-xl p-6 bg-white">
          <div className="text-gray-800 font-medium">Checking your access…</div>
          <div className="text-gray-500 text-sm mt-1">
            Verifying entitlements and team status.
          </div>
        </div>
      </div>
    );
  }

  if (decision.kind === 'LOGIN') {
    const ret = encodeURIComponent(
      location.pathname + location.search + location.hash,
    );
    return <Navigate to={`/login?returnTo=${ret}`} replace />;
  }

  if (decision.kind === 'NAVIGATE') {
    return <Navigate to={decision.to} replace state={{ from: location }} />;
  }

  if (decision.kind === 'SETUP') {
    return <SalesTrackInitializer />;
  }

  if (decision.kind === 'BLOCK_MEMBER') {
    return (
      <TeamProvider>
        <AccessPausedAutoSwitch isOwner={effectiveRole === 'OWNER'} />
      </TeamProvider>
    );
  }

  return (
    <TeamProvider>
      {children}
    </TeamProvider>
  );
}
