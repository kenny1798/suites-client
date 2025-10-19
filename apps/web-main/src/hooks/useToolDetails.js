// Simpan sebagai: src/hooks/useToolDetails.js

import { useState, useEffect } from 'react';
import {apiAuth} from '@suite/api-clients';

export function useToolDetails(slug) {
  const [state, setState] = useState({ 
    loading: true, 
    data: null, 
    error: null 
  });

  useEffect(() => {
    // Kalau tiada slug, jangan buat apa-apa
    if (!slug) {
      setState({ loading: false, data: null, error: 'No tool specified.' });
      return;
    }
    
    let isMounted = true;
    const fetchDetails = async () => {
      // Set semula state loading bila slug berubah
      setState({ loading: true, data: null, error: null }); 
      try {
        const response = await apiAuth.get(`/tools/${slug}`);
        if (isMounted) {
          setState({ loading: false, data: response.data, error: null });
        }
      } catch (err) {
        if (isMounted) {
          setState({ loading: false, data: null, error: err.response?.data?.error || err.message });
        }
      }
    };
    
    fetchDetails();

    return () => { 
      isMounted = false; 
    };
  }, [slug]); // Jalankan semula effect ni bila `slug` berubah

  return state;
}