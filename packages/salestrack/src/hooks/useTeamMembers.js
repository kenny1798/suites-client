import { useEffect, useState } from 'react';
import { toolsApi } from '@suite/api-clients';

export function useTeamMembers(teamId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(!!teamId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await toolsApi.get(`/api/salestrack/teams/${teamId}/members`, { timeout: 15000 });
        if (!alive) return;
        // API dah include Users — normalize ringkas
        const rows = Array.isArray(res?.data) ? res.data : [];
        setMembers(rows.map(r => ({
          id: r.id,
          role: r.role,
          userId: r.userId,
          teamId: r.teamId,
          user: r.User || r.Users || {}, // ikut include
        })));
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.error || 'Failed to fetch members');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [teamId]);

  return { members, loading, error };
}
