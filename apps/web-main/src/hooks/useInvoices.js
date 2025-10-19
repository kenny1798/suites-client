// Cipta fail baru: src/hooks/useInvoices.js

import { useState, useEffect } from 'react';
import {apiAuth} from '@suite/api-clients';

export function useInvoices() {
  const [state, setState] = useState({
    loading: true,
    data: [],
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchInvoices = async () => {
      try {
        const response = await apiAuth.get('/billing/invoices');
        if (isMounted) {
          setState({ loading: false, data: response.data || [], error: null });
        }
      } catch (err) {
        if (isMounted) {
          setState({ loading: false, data: [], error: err.message });
        }
      }
    };
    fetchInvoices();
    return () => { isMounted = false; };
  }, []);

  return state;
}