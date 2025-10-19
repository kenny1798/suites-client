import React from 'react';
import { useTeam } from '@suite/core-context';
import { useToolAccess } from '@suite/hooks';
import { Link } from 'react-router-dom';

export default function ToolAccessGuard({ toolId = 'salestrack', children }) {
  const { activeTeam } = useTeam();
  const { loading, state, owner } = useToolAccess(toolId, activeTeam?.id);

  if (!activeTeam) {
    return <div className="p-6">Please select a team to continue.</div>;
  }
  if (loading || state === 'loading') {
    return <div className="p-6">Checking access…</div>;
  }

  if (state === 'ok') return children;

  // Shared “no access” card
  const Card = ({ title, body, cta }) => (
    <div className="mx-auto max-w-xl mt-16 rounded-lg border bg-white p-8 text-center">
      <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">⚠️</div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-slate-600">{body}</p>
      {cta}
    </div>
  );

  switch (state) {
    case 'inactive':
    case 'expired':
      return (
        <Card
          title="Subscription Inactive"
          body={
            owner
              ? 'Your team’s SalesTrack subscription is not active. Please update billing or renew your plan.'
              : 'Your team’s SalesTrack subscription is not active. Please contact the team owner.'
          }
          cta={owner ? <a className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-white" href="/billing">Go to Billing Portal</a> : null}
        />
      );
    case 'no_entitlement':
      return (
        <Card
          title="Not Enabled"
          body="Your account does not have access to this tool."
          cta={<Link to="/marketplace" className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-white">Go to Store</Link>}
        />
      );
    case 'over_seat_limit':
      return <Card title="Seat Limit Reached" body="This team has exceeded its seat limit for the current plan. Please contact the team owner." />;
    case 'not_member':
      return <Card title="No Access" body="You are not a member of this team." />;
    case 'no_team':
      return <div className="p-6">Please select a team.</div>;
    default:
      return <Card title="Something Went Wrong" body="We couldn’t verify your access right now. Please try again." />;
  }
}
