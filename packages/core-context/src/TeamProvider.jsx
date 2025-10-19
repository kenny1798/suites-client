// src/context/TeamProvider.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@suite/auth';
import {toolsApi} from '@suite/api-clients';

const TeamContext = createContext(null);

export function TeamProvider({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeToolSlug = useMemo(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    return pathParts[0] || null; // "salestrack" | "hrotg" | null
  }, [location.pathname]);

  useEffect(() => {
    let alive = true;

    const fetchTeams = async () => {
      if (!user || !activeToolSlug) {
        if (!alive) return;
        setTeams([]);
        setActiveTeam(null);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const res = await toolsApi.get(`/api/${activeToolSlug}/teams`);
        const userTeams = Array.isArray(res?.data) ? res.data : [];
        if (!alive) return;

        setTeams(userTeams);

        if (userTeams.length > 0) {
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
  }, [user, activeToolSlug]);

  const switchTeam = (teamId) => {
    const newActive = teams.find(t => String(t.id) === String(teamId));
    if (newActive && newActive.id !== activeTeam?.id) {
      setActiveTeam(newActive);
      localStorage.setItem(`activeTeamId_${activeToolSlug}`, String(newActive.id));
      // ❌ elak window.location.reload(); biar React re-render saja
    }
  };

  const value = useMemo(() => ({
    teams,
    activeTeam,
    switchTeam,
    isLoading,
    activeToolSlug, // optional: handy untuk UI lain
  }), [teams, activeTeam, isLoading, activeToolSlug]);

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within a TeamProvider');
  return ctx;
}
