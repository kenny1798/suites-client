import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toolsApi } from '@suite/api-clients';

export function useDashboardData(teamId, startDate, endDate) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId || !startDate || !endDate) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const start = format(startDate, 'yyyy-MM-dd');
        const end = format(endDate, 'yyyy-MM-dd');
        const res = await toolsApi.get(
          `/api/salestrack/dashboard?teamId=${teamId}&startDate=${start}&endDate=${end}`
        );
        setData(res.data);
        console.log(res.data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [teamId, startDate, endDate]);

  return { data, isLoading, error };
}
