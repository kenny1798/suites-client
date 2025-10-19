import { useEffect, useState } from 'react';
import { toolsApi } from '@suite/api-clients';

export function useManagerReps(teamId, managerUserId) {
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(!!teamId && !!managerUserId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId || !managerUserId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await toolsApi.get(
          `/api/salestrack/reporting/teams/${teamId}/managers/${managerUserId}/reps`,
          { timeout: 15000 }
        );
        if (!alive) return;
        setReps(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.error || 'Failed to fetch reps');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [teamId, managerUserId]);

  return { reps, loading, error };
}
