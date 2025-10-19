import React, { useState } from 'react';
import { toolsApi } from '@suite/api-clients';

// Senarai status default
const defaultStatuses = [
  // Prospect Stage
  { name: 'New Lead', category: 'PROSPECT', order: 0 },
  { name: 'Contacted', category: 'PROSPECT', order: 1 },
  { name: 'Qualified', category: 'PROSPECT', order: 2 },
  // Pipeline Stage
  { name: 'Proposal Sent', category: 'PIPELINE', order: 3 },
  { name: 'Negotiation', category: 'PIPELINE', order: 4 },
  // Outcome Stage
  { name: 'Won', category: 'WON', order: 5 }, // Guna kategori sistem kita
  { name: 'Lost', category: 'LOST', order: 6 }, // Guna kategori sistem kita
];

export default function PipelineSetup({ team, onComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [statuses, setStatuses] = useState(defaultStatuses);

  const handleAddStatus = (category) => {
    const newStatus = {
      name: `New ${category} Status`,
      category: category,
      order: statuses.length,
    };
    setStatuses([...statuses, newStatus]);
  };

  const handleFinishSetup = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Hantar semua status ke backend
      await toolsApi.post(`/api/salestrack/teams/${team.id}/statuses`, statuses);
      onComplete(); // Panggil fungsi onComplete jika berjaya
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save pipeline settings.');
      setIsLoading(false);
    }
  };

  // Asingkan status mengikut kategori untuk paparan
  const prospectStatuses = statuses.filter(s => s.category === 'PROSPECT').sort((a,b) => a.order - b.order);
  const pipelineStatuses = statuses.filter(s => s.category === 'PIPELINE').sort((a,b) => a.order - b.order);
  const outcomeStatuses = statuses.filter(s => s.category === 'WON' || s.category === 'LOST').sort((a,b) => a.order - b.order);
  // (Hang boleh tambah 'ONGOING' di sini jika perlu)

  return (
    <div>
      <h2 className="text-2xl font-bold text-center">Customize Your Sales Pipeline</h2>
      <p className="text-center text-slate-500 mt-2">Drag-and-drop to reorder, edit, or add new stages.</p>

      <div className="mt-6 space-y-6">
        {/* Peringkat Prospect */}
        <div>
          <h3 className="font-semibold">1. Prospect / Lead Stage</h3>
          <div className="mt-2 p-3 border rounded-md bg-slate-50 space-y-2">
            {prospectStatuses.map((s, i) => <div key={i} className="p-2 bg-white rounded border">{s.name}</div>)}
            <button onClick={() => handleAddStatus('PROSPECT')} className="text-sm text-blue-600">+ Add Status</button>
          </div>
        </div>
        {/* Peringkat Pipeline */}
        <div>
          <h3 className="font-semibold">2. Pipeline / Deal Stage</h3>
          <div className="mt-2 p-3 border rounded-md bg-slate-50 space-y-2">
            {pipelineStatuses.map((s, i) => <div key={i} className="p-2 bg-white rounded border">{s.name}</div>)}
            <button onClick={() => handleAddStatus('PIPELINE')} className="text-sm text-blue-600">+ Add Status</button>
          </div>
        </div>
        {/* Peringkat Outcome */}
        <div>
          <h3 className="font-semibold">3. Outcome Stage</h3>
          <div className="mt-2 p-3 border rounded-md bg-slate-50 space-y-2">
            {outcomeStatuses.map((s, i) => <div key={i} className={`p-2 bg-white rounded border ${s.category === 'WON' ? 'border-green-400' : 'border-red-400'}`}>{s.name}</div>)}
            {/* Tak boleh tambah status Outcome secara manual, ia tetap */}
          </div>
        </div>
      </div>
      
      {error && <p className="text-sm text-red-600 text-center mt-4">{error}</p>}

      <div className="text-center mt-8">
        <button onClick={handleFinishSetup} disabled={isLoading} className="w-full rounded-md bg-slate-900 px-4 py-2 text-white font-semibold">
          {isLoading ? 'Saving...' : 'Finish Setup & Go to Dashboard'}
        </button>
      </div>
    </div>
  );
}