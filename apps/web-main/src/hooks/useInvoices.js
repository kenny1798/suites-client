import React from 'react';
import { apiAuth } from '@suite/api-clients';

export function useInvoices({ status = 'all', limit = 100, offset = 0 } = {}) {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState([]);
  const [error, setError] = React.useState(null);

  const fetcher = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (status && status !== 'all') qs.set('status', status);
      qs.set('limit', String(limit));
      qs.set('offset', String(offset));
      const { data } = await apiAuth.get(`/billing/invoices?${qs.toString()}`);
      setData(data?.items || []);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [status, limit, offset]);

  React.useEffect(() => { fetcher(); }, [fetcher]);

  return { loading, data, error, refetch: fetcher };
}
