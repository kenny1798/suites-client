import React, { useState, useEffect } from 'react';
import { useAuth } from '@suite/auth';

export default function CreateTeamForm({ defaultName = '', onNext }) {
  const { user } = useAuth();
  const [teamName, setTeamName] = useState(defaultName);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!defaultName) {
      setTeamName(`${user?.name || 'My'}'s Team`);
    }
  }, [defaultName, user?.name]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const n = (teamName || '').trim();
    if (!n) return setError('Team name is required.');
    setError('');
    onNext(n); // pass name to parent; API will be called at Finish
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center">Welcome to SalesTrack!</h2>
      <p className="text-center text-slate-500 mt-2">Let's start by naming your team.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="teamName" className="block text-sm font-medium text-slate-700">Team Name</label>
          <input
            id="teamName"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full rounded-md bg-slate-900 px-4 py-2 text-white font-semibold">
          Continue
        </button>
      </form>
    </div>
  );
}
