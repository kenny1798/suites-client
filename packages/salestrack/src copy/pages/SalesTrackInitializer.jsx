import React from 'react';
import { useAuth } from '@suite/auth';
import { useMySubs } from '@suite/hooks';
import { useTeam } from '@suite/core-context';
import { toolsApi } from '@suite/api-clients';

import SalesTrackDashboard from './Dashboard.jsx';
import SetupWizard from './SetupWizard.jsx';
import RenewSubscriptionPage from './RenewSubscriptionPage.jsx';
import ToolAccessGuard from '../components/ToolAccessGuard.jsx';

// --- optional: auto-setup for individual owners ---
function AutoSetup({ onComplete }) {
  const { user } = useAuth();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const teamName = user?.name ? `${user.name}'s Workspace` : 'My Workspace';
        const teamRes = await toolsApi.post('/api/salestrack/teams', { name: teamName });
        const team = teamRes.data;
        await toolsApi.post(`/api/salestrack/teams/${team.id}/statuses/default`);
        if (mounted) onComplete?.();
      } catch (e) {
        console.error('Auto-setup failed', e);
      }
    })();
    return () => { mounted = false; };
  }, [user, onComplete]);

  return <div className="p-6">Setting up your personal workspace…</div>;
}

export default function SalesTrackInitializer() {
  const { user } = useAuth();
  const { map: subsMap, loading: loadingSubs } = useMySubs();
  const { teams, isLoading: loadingTeams, activeTeam } = useTeam();

  const mySub = subsMap['salestrack'];                    // current user’s own sub (owner-style)
  const mySubActive = mySub && ['active', 'trialing'].includes(mySub.status);
  const mySubExpired = mySub && !mySubActive;
  const planId = user?.entitlements?.planId || null;      // you can drop this if not used

  if (loadingSubs || loadingTeams || !user) {
    return <div className="p-6">Loading your workspace…</div>;
  }

  // 1) Owner: I have my own SalesTrack subscription
  if (mySubActive) {
    // 2) I have active sub, but no teams yet → setup flow
    if (!teams || teams.length === 0) {
      // auto for individual, wizard for others
      if (planId === 'individual') {
        return <AutoSetup onComplete={() => window.location.reload()} />;
      }
      return <SetupWizard />;
    }

    // I’m subscribed and I have at least one team → show app behind the guard too (seat checks etc.)
    return (
      <ToolAccessGuard toolId="salestrack">
        <SalesTrackDashboard />
      </ToolAccessGuard>
    );
  }

  // 3) I have a subscription object but it’s not active → renew
  if (mySubExpired) {
    return <RenewSubscriptionPage />;
  }

  // 4) I don’t have my own sub.
  //    I might still be a member of a paid team: let the ToolAccessGuard handle it.
  //    If guard says "no_entitlement", we’ll redirect to Store there.
  //    If user also has no team selected, ask to pick/create one.
  if (!activeTeam && (!teams || teams.length === 0)) {
    // No teams at all → if you want, send them to SetupWizard (but they’ll need the owner plan to proceed)
    return <SetupWizard />;
  }

  return (
    <ToolAccessGuard toolId="salestrack">
      <SalesTrackDashboard />
    </ToolAccessGuard>
  );
}
