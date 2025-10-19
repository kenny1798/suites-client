import React from 'react';
import StageEditor from './StageEditor.jsx';

export default function PipelineEditor({ pipeline, onUpdate }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">2. Setup Sales Pipeline</h2>
      <p className="text-slate-500 text-sm mt-1">
        Susun dan tambah status untuk setiap kategori. Semua perubahan akan dihantar sekali bila tekan <b>Finish</b>.
      </p>

      <div className="mt-6 space-y-8">
        <StageEditor
          stageKey="PROSPECT"
          title="Prospect / Lead"
          statuses={pipeline.PROSPECT}
          onUpdate={onUpdate}
          // hasSystemCategory = false (Prospect buka OPEN by default masa save)
        />

        <StageEditor
          stageKey="DEAL"
          title="Deal"
          statuses={pipeline.DEAL}
          onUpdate={onUpdate}
          // hasSystemCategory = false
        />

        <StageEditor
          stageKey="OUTCOME"
          title="Outcome (Required: WON & LOST)"
          statuses={pipeline.OUTCOME}
          onUpdate={onUpdate}
          hasSystemCategory
          allowedSystem={['WON', 'LOST']}
        />

        <StageEditor
          stageKey="ONGOING"
          title="Ongoing (Post-sale)"
          statuses={pipeline.ONGOING}
          onUpdate={onUpdate}
          hasSystemCategory
          allowedSystem={['WON', 'LOST']}
        />
      </div>
    </div>
  );
}
