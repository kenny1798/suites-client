import React, { useMemo, useState } from 'react';
import { toolsApi } from '@suite/api-clients';
import CreateTeamForm from '../components/wizard/CreateTeamForm.jsx';
import StageEditor from '../components/wizard/StageEditor.jsx';

const initialPipeline = {
  Prospect: [
    { name: 'New Lead', category: 'Prospect', color: '#111827' },
    { name: 'Contacted', category: 'Prospect', color: '#1f2937' },
    { name: 'Qualified', category: 'Prospect', color: '#374151' },
  ],
  Deal: [
    { name: 'Proposal Sent', category: 'Deal', color: '#0f766e' },
    { name: 'Negotiation', category: 'Deal', color: '#047857' },
  ],
  Outcome: [
    { name: 'Successful Close', category: 'Outcome', color: '#166534' },
    { name: 'Rejected',         category: 'Outcome', color: '#b91c1c' },
  ],
  Ongoing: [
    { name: 'Repeat Customer', category: 'Ongoing', color: '#1d4ed8' },
    { name: 'Inactive',        category: 'Ongoing', color: '#6b7280' },
  ],
};

const CAT_ORDER = ['Prospect', 'Deal', 'Outcome', 'Ongoing'];

function buildPayload(pipeline) {
  let order = 1;
  const out = {};

  CAT_ORDER.forEach(cat => {
    const arr = pipeline[cat] || [];
    out[cat] = arr.map(s => ({
      name: (s.name || '').trim(),
      category: cat,
      color: s.color || null,   // biar null kalau tak pilih warna
      order: order++,
    }));
  });

  return out;
}

// util id stabil
const uid = () => (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) + Date.now().toString(36);
const withIds = (p) =>
  Object.fromEntries(
    Object.entries(p).map(([k, arr]) => [k, arr.map(s => ({ _id: uid(), ...s }))])
  );

// UI steps: 0 team, 1 Prospect, 2 Deal, 3 Outcome, 4 Ongoing
const TITLES = { 1: 'Prospect / Lead', 2: 'Deal', 3: 'Outcome', 4: 'Ongoing' };

export default function SetupWizard() {
  const [step, setStep] = useState(0);
  const [teamName, setTeamName] = useState('');
  // ⬇️ penting: init guna withIds
  const [pipeline, setPipeline] = useState(() => withIds(initialPipeline));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTeamNext = (name) => { setTeamName(name.trim()); setStep(1); };
  const handleUpdateStage = (stageKey, updatedStatuses) =>
    setPipeline(prev => ({ ...prev, [stageKey]: updatedStatuses }));

  const stageValid = useMemo(() => ({
    1: pipeline.Prospect.length > 0 && pipeline.Prospect.every(s => s.name?.trim()),
    2: pipeline.Deal.length > 0 && pipeline.Deal.every(s => s.name?.trim()),
    3: pipeline.Outcome.length > 0 && pipeline.Outcome.every(s => s.name?.trim()),
    4: pipeline.Ongoing.length > 0 && pipeline.Ongoing.every(s => s.name?.trim()),
  }), [pipeline]);

  const goNext = () => setStep(s => Math.min(4, s + 1));
  const goBack = () => setStep(s => Math.max(0, s - 1));

  // GANTI handleFinishSetup dengan versi ini
const handleFinishSetup = async () => {
    setIsLoading(true);
    setError('');
    const body = { name: teamName.trim(), ...buildPayload(pipeline) };
  
    try {
      console.log('[SetupWizard] submit body:', body);
  
      // 1) Cuba endpoint gabungan dengan timeout 15s
      await toolsApi.post('/api/salestrack/teams/setup', body, { timeout: 15000 });
  
      // 2) Success → reload
      window.location.reload();
      return;
    } catch (e) {
      // Log jelas di console
      console.error('[SetupWizard] /teams/setup failed:', e?.code, e?.response?.status, e);
  
      // 3) Fallback only if: 404 Not Found, 501/500 tertentu, atau timeout/Network Error
      const status = e?.response?.status;
      const isTimeout = e?.code === 'ECONNABORTED';
      const isNetwork = e?.message?.toLowerCase?.().includes('network');
  
      if (status === 404 || status === 501 || isTimeout || isNetwork) {
        try {
          // Flow lama: create team → post statuses mengikut payload object
          const teamResp = await toolsApi.post('/api/salestrack/teams', { name: teamName.trim() }, { timeout: 15000 });
          const team = teamResp.data;
  
          await toolsApi.post(
            `/api/salestrack/teams/${team.id}/statuses`,
            body,                                // hantar OBJECT yang sama (controller fallback kita dah support)
            { timeout: 15000, headers: { 'Content-Type': 'application/json' } }
          );
  
          window.location.reload();
          return;
        } catch (e2) {
          console.error('[SetupWizard] fallback flow failed:', e2?.code, e2?.response?.status, e2);
          setError(e2?.response?.data?.error || 'Setup failed on fallback.');
        }
      } else {
        // Kalau error lain (401/403/422 dsb.), tunjuk mesej dari server
        setError(e?.response?.data?.error || 'Failed to complete setup.');
      }
    } finally {
      // Kalau kita tak reload (gagal), pastikan loading off
      setIsLoading(false);
    }
  };
  
  
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-3xl p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Team Setup Wizard</h1>
          <div className="text-sm text-slate-500">Step {step + 1} of 5</div>
        </div>

        {step === 0 && <CreateTeamForm defaultName={teamName} onNext={handleTeamNext} />}

        {step === 1 && <StageEditor stageKey="Prospect" title={TITLES[1]} note="Select/add status for prospect early stage." statuses={pipeline.Prospect} onUpdate={handleUpdateStage} />}
        {step === 2 && <StageEditor stageKey="Deal"     title={TITLES[2]} note="Select/add status for dealing stage."       statuses={pipeline.Deal}     onUpdate={handleUpdateStage} />}
        {step === 3 && <StageEditor stageKey="Outcome"  title={TITLES[3]} note="Select/add status for outcome/result stage." statuses={pipeline.Outcome}  onUpdate={handleUpdateStage} />}
        {step === 4 && <StageEditor stageKey="Ongoing"  title={TITLES[4]} note="Select/add status for post-sales stage."     statuses={pipeline.Ongoing}  onUpdate={handleUpdateStage} />}

        <div className="flex justify-between items-center pt-4 border-t mt-6">
          {step > 0 ? (
            <button onClick={goBack} className="text-sm font-semibold hover:underline" disabled={isLoading} type="button">Back</button>
          ) : <span />}

          {step > 0 && step < 4 && (
            <button onClick={goNext} disabled={isLoading || !stageValid[step]} className="ml-auto rounded-md bg-slate-900 px-4 py-2 text-white font-semibold disabled:opacity-50" type="button">
              Next
            </button>
          )}

          {step === 4 && (
            <button onClick={handleFinishSetup} disabled={isLoading || !stageValid[4]} className="ml-auto rounded-md bg-green-600 px-4 py-2 text-white font-semibold disabled:opacity-50" type="button">
              {isLoading ? 'Saving…' : 'Finish Setup'}
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-600 text-center mt-2">{error}</p>}
      </div>
    </div>
  );
}
