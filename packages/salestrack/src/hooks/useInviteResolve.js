// src/hooks/useInviteResolve.js
import { useEffect, useState } from 'react';
import { toolsApi } from '@suite/api-clients';

export function useInviteResolve({ teamId, hash, pos, inviterId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!teamId || !hash || !inviterId) {
        setLoading(false);
        setError('Invalid link.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const url =
          `/api/salestrack/invite/resolve/${encodeURIComponent(teamId)}` +
          `/${encodeURIComponent(hash)}` +
          (pos ? `/${encodeURIComponent(pos)}` : '') +
          `/${encodeURIComponent(inviterId)}`;

        const res = await toolsApi.get(url, { timeout: 15000 });
        if (!alive) return;
        setData(res.data);
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.error || 'Invalid link.');
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [teamId, hash, pos, inviterId]);

  return { data, loading, error };
}
