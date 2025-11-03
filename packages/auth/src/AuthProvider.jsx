import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { apiAuth } from '@suite/api-clients';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

/**
 * Shape yang kita simpan dalam state:
 * user = {
 *   ...profile,
 *   suiteEntitlements: {
 *     tools: string[],
 *     entitlements: {
 *       [toolId: string]: {
 *         status: 'trialing'|'active'|'expired'|'past_due'|'suspended'|'canceled',
 *         planCode: string,
 *         planName: string|null,
 *         trialEnd: string|null,
 *         features: {
 *           [featureKey: string]: { enabled: boolean, limit: number|string|null }
 *         }
 *       }
 *     }
 *   }
 * }
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ===========================
   * Helpers (pure functions)
   * =========================== */
  const getEntitlements = useCallback(() => user?.suiteEntitlements ?? { tools: [], entitlements: {} }, [user]);

  /** Semak kewujudan feature untuk tool tertentu */
  const has = useCallback((toolId, featureKey) => {
    const se = getEntitlements();
    return !!se?.entitlements?.[toolId]?.features?.[featureKey]?.enabled;
  }, [getEntitlements]);

  /** Ambil limit (int/text) sesuatu feature, atau fallback */
  const limit = useCallback((toolId, featureKey, fallback = null) => {
    const se = getEntitlements();
    const v = se?.entitlements?.[toolId]?.features?.[featureKey];
    if (!v) return fallback;
    return v.limit ?? fallback;
  }, [getEntitlements]);

  /** Dapatkan seluruh blok entitlements untuk tool */
  const entitlementsFor = useCallback((toolId) => {
    const se = getEntitlements();
    return se?.entitlements?.[toolId] ?? null;
  }, [getEntitlements]);

  /* ===========================
   * Network calls
   * =========================== */

  // OS-level entitlements (multi-tool)
  const fetchSuiteEntitlements = useCallback(async () => {
    try {
      const { data } = await apiAuth.get('/billing/tools/entitlements');
      return data || { tools: [], entitlements: {} };
    } catch (e) {
      console.error('Failed to fetch suite entitlements:', e);
      return { tools: [], entitlements: {} };
    }
  }, []);

  /** Public: refresh entitlements */
  const refreshEntitlements = useCallback(async () => {
    const ent = await fetchSuiteEntitlements();
    setUser((prev) => (prev ? { ...prev, suiteEntitlements: ent } : prev));
  }, [fetchSuiteEntitlements]);

  /** Login hydrates token + profile + entitlements */
  const login = useCallback(async ({ token, profile }) => {
    localStorage.setItem('accessToken', token);
    const ent = await fetchSuiteEntitlements();
    setUser({ ...profile, suiteEntitlements: ent });
  }, [fetchSuiteEntitlements]);

  const loginWithEmail = useCallback(async (email, password) => {
    const { data } = await apiAuth.post('/auth/login', { email, password });
    await login({ token: data.token, profile: data.user });
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  // Rehydrate on app start
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profileRes = await apiAuth.get('/user/profile');
        const ent = await fetchSuiteEntitlements();
        setUser({ ...profileRes.data, suiteEntitlements: ent });
      } catch (err) {
        console.error('Token validation failed, logging out.', err);
        logout();
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchSuiteEntitlements, logout]);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    loginWithEmail,
    logout,
    refreshEntitlements,
    // helpers
    has,
    limit,
    entitlementsFor,
    // quick access
    tools: user?.suiteEntitlements?.tools ?? [],
    suiteEntitlements: user?.suiteEntitlements ?? { tools: [], entitlements: {} },
  }), [user, loading, login, loginWithEmail, logout, refreshEntitlements, has, limit, entitlementsFor]);

  return (
    <AuthCtx.Provider value={value}>
      {!loading && children}
    </AuthCtx.Provider>
  );
}
