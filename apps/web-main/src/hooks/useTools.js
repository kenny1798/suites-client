// Simpan sebagai: src/hooks/useTools.js

import { useState, useEffect } from 'react';
import {apiAuth} from '@suite/api-clients'; // Guna API library yang kita buat tadi

export function useTools() {
  const [state, setState] = useState({
    loading: true,
    data: [],
    error: null,
  });

  useEffect(() => {
    // Flag untuk elak state update kalau komponen dah unmount
    let isMounted = true;

    const fetchTools = async () => {
      try {
        const response = await apiAuth.get('/tools');
        
        if (isMounted) {
          setState({
            loading: false,
            data: response.data || [], // Pastikan data sentiasa array
            error: null,
          });
        }
      } catch (err) {
        if (isMounted) {
          setState({
            loading: false,
            data: [],
            error: err.response?.data?.error || err.message,
          });
        }
      }
    };

    fetchTools();

    // Fungsi cleanup: set isMounted ke false bila komponen unmount
    return () => {
      isMounted = false;
    };
  }, []); // Array kosong bermakna useEffect ni hanya jalan sekali masa komponen mount

  return state;
}