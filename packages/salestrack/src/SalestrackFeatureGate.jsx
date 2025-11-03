import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@suite/auth';
import { useTeam } from '@suite/core-context';
import { useSalestrackTeamAccess } from './hooks/useSalestrackTeamAccess';

const STORE_PATH = '/store?tool=salestrack';
const RENEW_PATH = '/billing/renew/salestrack';

function AccessPausedNotice() {
  const navigate = useNavigate();
  return (
    <div className="p-8">
      <div className="max-w-lg mx-auto border rounded-xl p-6 bg-white text-center">
        <div className="text-lg font-semibold text-gray-900">Access Paused</div>
        <p className="text-sm text-gray-600 mt-2">
          Your team's subscription for SalesTrack has expired or is unpaid. Please inform the team owner to renew so that access can be reactivated.
        </p>
        <div className="mt-4">
          <button
            onClick={() => navigate('/marketplace')}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800"
          >
            Go to Marketplace
          </button>
        </div>
      </div>
    </div>
  );
}

export function SalestrackFeatureGate({ featureKey, min = 1, children }) {
  const { has, limit, entitlementsFor, tools } = useAuth();
  const { activeTeam } = useTeam();
  const { canUseThisTeam, myRole } = useSalestrackTeamAccess();
  const location = useLocation();

  const st = entitlementsFor?.('salestrack') || null;
  const status = (st?.status || '').toLowerCase();
  const isExpiredLike = ['expired','canceled','past_due','barred'].includes(status);
  const hasTool = Array.isArray(tools) && tools.includes('salestrack');
  const sources = Array.isArray(st?.sources) ? st.sources : [];
  const hasDirect = sources.some(s => s?.type === 'direct') || (st?.source === 'direct');

  // 🔸 bukan owner & tiada sub direct → Access Paused
  if (myRole !== 'OWNER' && (!hasDirect || !canUseThisTeam)) {
    return <AccessPausedNotice />;
  }

  // 🔸 owner tapi expired → renew
  if (myRole === 'OWNER' && isExpiredLike) {
    return <Navigate to={RENEW_PATH} replace state={{ from: location }} />;
  }

  // feature check
  const enabled = has?.('salestrack', featureKey);
  const lvl = Number(limit?.('salestrack', featureKey, 0));
  const ok = Boolean(enabled) && (lvl >= min);

  if (ok) return children;

  // owner tapi tak cukup feature → store
  if (myRole === 'OWNER') {
    const redirect = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`${STORE_PATH}&redirect=${encodeURIComponent(redirect)}`} replace state={{ from: location }} />;
  }

  // fallback
  return <AccessPausedNotice />;
}

export default SalestrackFeatureGate;
