// src/context/TeamProvider.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@suite/auth';
import { toolsApi } from '@suite/api-clients';

const TeamContext = createContext(null);

export function TeamProvider({ children, toolSlug: toolSlugOverride = null }) {
  const { user } = useAuth();
  const location = useLocation();
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Detect current "context slug" from URL
  const activeToolSlug = useMemo(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    return pathParts[0] || null; // "salestrack" | "hrotg" | "store" | etc.
  }, [location.pathname]);

  // 2. Kenal pasti slug ni sebenarnya tool ke bukan
  //    senarai global pages yg BUKAN tool → jangan fetch /api/<slug>/teams
  const NON_TOOL_PREFIXES = useMemo(() => ([
    'store',
    'marketplace',
    'billing',
    'settings',
    'profile',
    '',          // root "/"
  ]), []);

  const isGlobalPage = !activeToolSlug || NON_TOOL_PREFIXES.includes(activeToolSlug);

  useEffect(() => {
    let alive = true;

    const fetchTeams = async () => {
      // case 1: user belum login
      // case 2: kita bukan dalam tool page (contoh /store)
      if (!user || isGlobalPage) {
        if (!alive) return;
        setTeams([]);
        setActiveTeam(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // GET /api/<toolSlug>/teams
        const res = await toolsApi.get(`/api/${activeToolSlug}/teams`);
        const userTeams = Array.isArray(res?.data) ? res.data : [];
        if (!alive) return;

        setTeams(userTeams);

        if (userTeams.length > 0) {
          // cuba restore pilihan team terakhir untuk tool ni
          const lastId = localStorage.getItem(`activeTeamId_${activeToolSlug}`);
          const found = userTeams.find(t => String(t.id) === String(lastId));
          setActiveTeam(found || userTeams[0]);
        } else {
          setActiveTeam(null);
        }
      } catch (e) {
        console.error(`Failed to fetch teams for ${activeToolSlug}:`, e);
        if (!alive) return;
        setTeams([]);
        setActiveTeam(null);
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    fetchTeams();
    return () => { alive = false; };
  }, [user, activeToolSlug, isGlobalPage]);

  // 3. let user switch active team manually
  const switchTeam = (teamId) => {
    const newActive = teams.find(t => String(t.id) === String(teamId));
    if (newActive && newActive.id !== activeTeam?.id) {
      setActiveTeam(newActive);
      // remember this choice for this specific tool
      if (!isGlobalPage && activeToolSlug) {
        localStorage.setItem(`activeTeamId_${activeToolSlug}`, String(newActive.id));
      }
    }
  };

  const value = useMemo(() => ({
    teams,
    activeTeam,
    switchTeam,
    isLoading,
    activeToolSlug, // nice for components that need to know current tool
  }), [teams, activeTeam, isLoading, activeToolSlug]);

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within a TeamProvider');
  return ctx;
}
