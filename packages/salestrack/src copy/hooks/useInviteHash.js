import { useEffect, useState } from 'react';
import { toolsApi } from '@suite/api-clients';

export function useInviteHash(teamId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!teamId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!teamId) return;
    let alive = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const res = await toolsApi.get(`/api/salestrack/teams/${teamId}/invite-hash`, { timeout: 10000 });
        if (alive) setData(res.data);
      } catch (e) {
        if (alive) setError(e?.response?.data?.error || 'Failed to get invite hash.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [teamId]);

  return { data, loading, error };
}
