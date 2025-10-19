// Generic access checker for any tool/team combo
// Usage: const {loading, state, reason, owner, team} = useToolAccess('salestrack', activeTeam?.id)

import { useEffect, useState } from 'react';
import { toolsApi } from '@suite/api-clients';

export function useToolAccess(toolId, teamId) {
  const [res, setRes] = useState({
    loading: true,
    state: 'loading',   // 'ok' | 'inactive' | 'expired' | 'no_team' | 'no_entitlement' | 'over_seat_limit' | 'not_member' | 'error'
    reason: null,       // backend specific reason if any
    owner: null,        // is the current user the team owner?
    team: null,         // basic team info returned by backend (optional)
  });

  useEffect(() => {
    if (!toolId) {
      setRes({ loading: false, state: 'error', reason: 'no_tool', owner: null, team: null });
      return;
    }
    if (!teamId) {
      setRes({ loading: false, state: 'no_team', reason: null, owner: null, team: null });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data } = await toolsApi.get(`/api/${toolId}/access`, { params: { teamId } });
        if (cancelled) return;

        if (data.ok) {
          setRes({ loading: false, state: 'ok', reason: null, owner: !!data.owner, team: data.team || null });
        } else {
          // normalize some common reasons from backend
          const reason = data.reason || 'inactive';
          setRes({ loading: false, state: reason, reason, owner: !!data.owner, team: data.team || null });
        }
      } catch (e) {
        if (cancelled) return;
        setRes({
          loading: false,
          state: 'error',
          reason: e?.response?.data?.error || e?.message || 'failed',
          owner: null,
          team: null,
        });
      }
    })();

    return () => { cancelled = true; };
  }, [toolId, teamId]);

  return res;
}
