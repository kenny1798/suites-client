// packages/salestrack/src/hooks/useSalestrackTeamAccess.js
import React from 'react';
import { useAuth } from '@suite/auth';
import { useTeam } from '@suite/core-context';

/**
 * Returns:
 *  - canUseThisTeam: boolean
 *  - reason: 'owner' | 'inherited' | 'no_inherited_for_this_team' | 'no_team' | 'insufficient_data'
 *  - myRole: team role string (OWNER/ADMIN/MANAGER/SALES_REP/undefined)
 *  - ownerId: number | undefined
 *  - status: entitlement status (lowercased) e.g. active|trialing|expired|...
 */
export function useSalestrackTeamAccess() {
  const { entitlementsFor, user } = useAuth();
  const { activeTeam } = useTeam();

  const st = entitlementsFor?.('salestrack') || null;
  const status = (st?.status || '').toLowerCase();

  // derive myRole null-safe
  const myRole = React.useMemo(() => {
    if (!activeTeam) return undefined;
    if (activeTeam.role) return activeTeam.role;
    const list = Array.isArray(activeTeam.TeamMembers) ? activeTeam.TeamMembers : [];
    if (!list.length) return undefined;
    const mine = user?.id ? list.find(m => m.userId === user.id) : null;
    return mine?.role ?? list[0]?.role ?? undefined;
  }, [activeTeam, user?.id]);

  const ownerId = activeTeam?.ownerId; // <-- PASTIKAN /api/salestrack/teams hantar ownerId
  const sources = Array.isArray(st?.sources) ? st.sources : [];
  const hasOwnerId = typeof ownerId !== 'undefined' && ownerId !== null;

  // OWNER: direct entitlement cukup untuk team sendiri
  if (myRole === 'OWNER') {
    return { canUseThisTeam: true, reason: 'owner', myRole, ownerId, status };
  }

  // Tiada team context
  if (!activeTeam) {
    return { canUseThisTeam: false, reason: 'no_team', myRole, ownerId, status };
  }

  // MEMBER: perlu inherited dari owner team semasa
  if (!hasOwnerId || sources.length === 0) {
    // data tak cukup untuk sahkan inherited source → fallback selamat
    return { canUseThisTeam: false, reason: 'insufficient_data', myRole, ownerId, status };
  }

  const hasInheritedFromThisOwner = sources.some(
    s => s?.type === 'inherited' && s?.ownerUserId === ownerId
  );

  if (hasInheritedFromThisOwner) {
    return { canUseThisTeam: true, reason: 'inherited', myRole, ownerId, status };
  }

  return { canUseThisTeam: false, reason: 'no_inherited_for_this_team', myRole, ownerId, status };
}
