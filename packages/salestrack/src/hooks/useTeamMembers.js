// hooks/useTeamMembers.js
import { useEffect, useState } from 'react';
import { toolsApi } from '@suite/api-clients';

export function useTeamMembers(teamId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(!!teamId);
  const [error, setError] = useState('');

  const load = async () => {
    if (!teamId) return;
    setLoading(true); setError('');
    try {
      const res = await toolsApi.get(`/api/salestrack/teams/${teamId}/members`, { timeout: 15000 });
      setMembers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.response?.data?.error || 'FAILED_TO_LOAD_MEMBERS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (teamId) load(); }, [teamId]);

  return { members, loading, error, refresh: load };
}
