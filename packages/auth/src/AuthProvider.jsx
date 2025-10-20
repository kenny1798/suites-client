// Ganti kod penuh dalam pakej @suite/auth, cth: packages/auth/src/AuthProvider.jsx

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { apiAuth } from '@suite/api-clients';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  // Kita akan simpan 'entitlements' di dalam objek 'user'
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk dapatkan entitlements dan gabungkan dengan data user sedia ada
  const refreshEntitlements = async () => {
    try {
      const { data } = await apiAuth.get("/billing/me/entitlements");
      setUser(currentUser => ({ ...currentUser, entitlements: data }));
    } catch (e) {
      console.error("Failed to refresh entitlements:", e);
      setUser(currentUser => ({ ...currentUser, entitlements: null }));
    }
  };

  // Fungsi login kini hanya perlu uruskan token dan profil awal
  const login = async ({ token, profile }) => {
    localStorage.setItem("accessToken", token);
    setUser(profile); // Terus set profil, entitlements akan direfresh
    await refreshEntitlements();
  };

  const loginWithEmail = async (email, password) => {
    const { data } = await apiAuth.post('/auth/login', { email, password });
    await login({ token: data.token, profile: data.user });
  };


  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
  };
  
  // useEffect ini akan jalan sekali sahaja bila aplikasi dimuatkan
  useEffect(() => {
    const checkLoggedInUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // 1. Dapatkan profil pengguna
        const profileRes = await apiAuth.get('/user/profile');
        const profileData = profileRes.data;

        // 2. Dapatkan entitlements pengguna
        const entitlementsRes = await apiAuth.get('/billing/me/entitlements');
        const entitlementsData = entitlementsRes.data;

        // 3. Gabungkan dan set state user
        setUser({ ...profileData, entitlements: entitlementsData });

      } catch (error) {
        console.error("Token validation failed, logging out.", error);
        logout(); // Jika token tak sah, terus logout
      } finally {
        setLoading(false);
      }
    };
    checkLoggedInUser();
  }, []); // Array dependency kosong untuk jalan sekali sahaja

  // Guna useMemo untuk elak re-render yang tak perlu
  const value = useMemo(() => ({
    user,
    loading,
    login,
    loginWithEmail,
    logout,
    refreshEntitlements,
  }), [user, loading]);

  return (
    <AuthCtx.Provider value={value}>
      {/* Hanya render aplikasi bila dah selesai loading */}
      {!loading && children}
    </AuthCtx.Provider>
  );
}