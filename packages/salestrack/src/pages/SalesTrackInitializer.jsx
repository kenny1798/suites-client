// packages/salestrack/src/pages/SalesTrackInitializer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTeam } from '@suite/core-context';
import SetupWizard from './SetupWizard.jsx';

export default function SalesTrackInitializer() {
  const { activeTeam, isLoading } = useTeam() || {};

  if (!activeTeam) {
    return <SetupWizard />;
  }

  // Ada team → tunjuk menu permulaan
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-xl font-semibold">SalesTrack</h1>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card title="Contacts" desc="Add leads and clients you’re talking to." to="/salestrack/contacts" />
        <Card title="Opportunities" desc="Track deals across your pipeline." to="/salestrack/opportunities" />
        <Card title="Performance" desc="Track your performance." to="/salestrack/performance" />
        <Card title="Tasks" desc="View your day to day tasks." to="/salestrack/opportunities" />
      </div>

      <div className="text-sm text-gray-500">
        Active team: <b>{activeTeam?.name || '—'}</b>
      </div>
    </div>
  );
}

function Card({ title, desc, to }) {
  return (
    <div className="border rounded-xl p-5 bg-white">
      <div className="font-medium">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{desc}</div>
      <Link to={to} className="inline-block mt-3 text-sm underline">Open</Link>
    </div>
  );
}
