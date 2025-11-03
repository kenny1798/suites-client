// packages/salestrack/src/components/wizard/CreateTeamForm.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@suite/auth';

export default function CreateTeamForm({
  defaultName = '',
  defaultCountry = 'MY',
  defaultCurrency = 'MYR',
  defaultTimeZone = (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kuala_Lumpur'),
  onNext,
}) {
  const { user } = useAuth();

  const [teamName, setTeamName] = useState(defaultName);
  const [country, setCountry] = useState(defaultCountry);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [timeZone, setTimeZone] = useState(defaultTimeZone);

  const [error, setError] = useState('');

  useEffect(() => {
    if (!defaultName) {
      // e.g. "Ishman's Team"
      const first = (user?.name || 'My').split(' ')[0];
      setTeamName(`${first} Team`);
    }
  }, [defaultName, user?.name]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const n = (teamName || '').trim();
    if (!n) {
      setError('Team name is required.');
      return;
    }
    setError('');

    const payload = {
      name: n,
      teamBasedCountry: (country || '').trim().toUpperCase(), // e.g. MY
      teamCurrency: (currency || '').trim().toUpperCase(),    // e.g. MYR
      teamTimeZone: (timeZone || '').trim(),                   // e.g. Asia/Singapore
    };

    onNext?.(payload); // parent (SetupWizard) akan consume object ni
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center">Welcome to SalesTrack!</h2>
      <p className="text-center text-slate-500 mt-2">Let's start by naming your team.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="teamName" className="block text-sm font-medium text-slate-700">Team Name</label>
          <input
            id="teamName"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
            placeholder="e.g. Sales Team A"
            required
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
              placeholder="MY"
            />
            <p className="mt-1 text-xs text-slate-500">2-letter code (e.g., MY, SG, US)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Currency</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
              placeholder="MYR"
            />
            <p className="mt-1 text-xs text-slate-500">3-letter code (e.g., MYR, SGD, USD)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Time Zone</label>
            <input
              type="text"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
              placeholder="Asia/Kuala_Lumpur"
            />
            <p className="mt-1 text-xs text-slate-500">IANA TZ (e.g., Asia/Singapore)</p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-white font-semibold"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
