// src/hooks/useTeamRole.js
import { useEffect, useMemo, useState } from 'react';
import { toolsApi } from '@suite/api-clients';
import { useAuth } from '@suite/auth';

/**
 * Return:
 *  - role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'SALES_REP' | null
 *  - canInvite: boolean (OWNER/ADMIN/MANAGER)
 *  - loading: boolean
 */
export function useTeamRole(teamId) {
  const { user } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!user || !teamId) {
        setRole(null);
        return;
      }
      setLoading(true);
      try {
        const res = await toolsApi.get(`/api/salestrack/teams/${teamId}/members`, {
          timeout: 15000,
        });
        const list = Array.isArray(res.data) ? res.data : [];
        const mine = list.find((m) => String(m.userId) === String(user.id));
        if (alive) setRole(mine?.role || null);
      } catch (e) {
        if (alive) setRole(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [teamId, user?.id]);

  const canInvite = useMemo(
    () => role === 'OWNER' || role === 'ADMIN' || role === 'MANAGER',
    [role]
  );

  return { role, canInvite, loading };
}
