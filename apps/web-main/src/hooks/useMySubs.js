// Simpan sebagai: src/hooks/useMySubs.js

import { useState, useEffect } from 'react';
import {apiAuth} from '@suite/api-clients';

export function useMySubs() {
  const [state, setState] = useState({
    loading: true,
    data: [], // Array asal dari API
    map: {},   // Objek untuk akses pantas (e.g., map['salestrack'])
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchSubs = async () => {
      try {
        const response = await apiAuth.get('/billing/me/subscriptions');
        const subsArray = response.data || [];

        // Proses data array jadi objek map
        const subsMap = {};
        for (const sub of subsArray) {
          if (sub.toolId) {
            subsMap[sub.toolId] = sub;
          }
        }

        if (isMounted) {
          setState({
            loading: false,
            data: subsArray,
            map: subsMap,
            error: null,
          });
        }
      } catch (err) {
        if (isMounted) {
          setState({
            loading: false,
            data: [],
            map: {},
            error: err.response?.data?.error || err.message,
          });
        }
      }
    };

    fetchSubs();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}