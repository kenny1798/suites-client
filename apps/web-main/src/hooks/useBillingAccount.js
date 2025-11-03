// src/hooks/useBillingAccount.js
import * as React from 'react';
import { billingApi } from '../api/billingApi';

export function useBillingAccount() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);

  const refetch = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const d = await billingApi.account();
      setData(d);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { refetch(); }, [refetch]);

  return { loading, data, error, refetch };
}
