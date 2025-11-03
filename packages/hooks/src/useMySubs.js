// packages/hooks/src/useMySubs.js
// DIKEMASKINI: Tambah 'refetch' function untuk dipanggil dari luar

import { useState, useEffect, useCallback } from 'react'; // Tambah useCallback
import { apiAuth } from '@suite/api-clients';

export function useMySubs() {
  const [state, setState] = useState({
    loading: true,
    data: [], // Array asal dari API
    map: {},   // Objek untuk akses pantas (cth: map['salestrack'])
    error: null,
  });

  // Asingkan logik fetch ke dalam function yang boleh dipanggil semula
  // Guna useCallback supaya function ni stable
  const fetchSubs = useCallback(async () => {
    // Set loading (kalau bukan first load, kita tak set loading global)
    // setState(s => ({ ...s, loading: true })); // Option: tunjuk loading

    try {
      // Panggil endpoint dari servis Auth/Billing
      const response = await apiAuth.get('/billing/me/subscriptions');
      const subsArray = response.data || [];

      const subsMap = {};
      for (const sub of subsArray) {
        if (sub.toolId) {
          subsMap[sub.toolId] = sub;
        }
      }

      setState({
        loading: false,
        data: subsArray,
        map: subsMap,
        error: null,
      });

    } catch (err) {
      setState({
        loading: false,
        data: [],
        map: {},
        error: err.response?.data?.error || err.message,
      });
    }
  }, []); // useCallback dependency array kosong, function ni takkan recreate

  // useEffect untuk fetch masa first load
  useEffect(() => {
    // (Note: 'isMounted' check tak perlu kalau fetchSubs dalam useCallback)
    fetchSubs();
  }, [fetchSubs]); // Panggil bila fetchSubs (useCallback) di-create

  // Pulangkan state DAN function refetch
  return { ...state, refetch: fetchSubs };
}
