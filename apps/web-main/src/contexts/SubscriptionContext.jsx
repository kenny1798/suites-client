// src/contexts/SubscriptionContext.jsx
import React, { 
    createContext, 
    useContext, 
    useState, 
    useEffect, 
    useCallback 
  } from 'react';
  import { apiAuth } from '@suite/api-clients';
  
  // 1. Cipta Context
  const SubscriptionContext = createContext(null);
  
  // 2. Cipta Provider (wrapper)
  export function SubscriptionProvider({ children }) {
    const [state, setState] = useState({
      loading: true,
      data: [], // Array asal dari API
      map: {},   // Objek untuk akses pantas (cth: map['salestrack'])
      error: null,
    });
  
    // Logik fetch (sama macam dalam useMySubs.js)
    const fetchSubs = useCallback(async () => {
      // Jangan set loading: true di sini, nanti semua page refresh
      // Cuma set kalau dia first load
      
      try {
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
    }, []);
  
    // Panggil sekali masa first load
    useEffect(() => {
      fetchSubs();
    }, [fetchSubs]);
  
    // Ini 'value' yang kita akan bagi kat semua komponen
    const value = {
      ...state,
      refetch: fetchSubs, // Bagi function refetch sekali
    };
  
    return (
      <SubscriptionContext.Provider value={value}>
        {children}
      </SubscriptionContext.Provider>
    );
  }
  
  // 3. Cipta Hook (Ini hook baru yang semua komponen akan guna)
  export function useSubscriptions() {
    const context = useContext(SubscriptionContext);
    if (!context) {
      throw new Error('useSubscriptions mesti diguna dalam SubscriptionProvider');
    }
    return context;
  }
  