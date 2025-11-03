import React from 'react';

export default function StageEditor({ stageKey, title, note = '', statuses, onUpdate }) {
  const canWonLost = stageKey === 'Outcome' || stageKey === 'Ongoing';

  const patchAt = (index, patch) => {
    const next = [...statuses];
    next[index] = { ...next[index], ...patch };
    onUpdate(stageKey, next);
  };

  const handleNameChange = (index, v) => patchAt(index, { name: v });
  const handleColorChange = (index, v) => patchAt(index, { color: v || '' });
  const handleResetColor = (index) => patchAt(index, { color: '' });

  const handleToggleWon = (index, v) => {
    if (!canWonLost) return;
    patchAt(index, { isWon: !!v, isLost: v ? false : statuses[index]?.isLost || false });
  };
  const handleToggleLost = (index, v) => {
    if (!canWonLost) return;
    patchAt(index, { isLost: !!v, isWon: v ? false : statuses[index]?.isWon || false });
  };
  const handleToggleFollowUp = (index, v) => patchAt(index, { isFollowUpStage: !!v });

  const handleAddStatus = () => {
    const uid = () =>
      (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) + Date.now().toString(36);
    onUpdate(stageKey, [
      ...statuses,
      { _id: uid(), name: 'New Status', category: stageKey, color: '', isWon: false, isLost: false, isFollowUpStage: false },
    ]);
  };

  const handleDelete = (index) => onUpdate(stageKey, statuses.filter((_, i) => i !== index));
  const handleMove = (index, dir) => {
    if ((index === 0 && dir === -1) || (index === statuses.length - 1 && dir === 1)) return;
    const next = [...statuses];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    onUpdate(stageKey, next);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {note && <p className="text-slate-500 text-sm mt-1">{note}</p>}

      <div className="mt-4 space-y-3">
        {statuses.map((status, index) => {
          const color = status.color || '';
          return (
            <div key={status._id || index} className="rounded-md border bg-white p-3">
              {/* ROW 1: name & actions (responsive) */}
              <div className="grid grid-cols-12 gap-2 items-start">
                {/* left: color + name (col-span mobile full, md 9) */}
                <div className="col-span-12 md:col-span-9 flex items-center gap-2">
                  <input
                    type="color"
                    value={color || '#000000'}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    className="h-8 w-8 p-0 border rounded cursor-pointer"
                    title="Choose color"
                  />
                  <input
                    type="text"
                    value={status.name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    style={{ color: color || undefined }}
                    className="flex-1 min-w-0 p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    placeholder="Status name"
                  />
                </div>

                {/* right: actions (col-span mobile auto, md 3) align right */}
                <div className="col-span-12 md:col-span-3 flex md:justify-end gap-2 mt-2 md:mt-0">
                  <button
                    type="button"
                    onClick={() => handleResetColor(index)}
                    className="px-2 py-1 text-xs rounded border border-slate-300 hover:bg-slate-50"
                    title="Reset color"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === statuses.length - 1}
                    className="px-2 py-1 text-xs rounded border disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="px-2 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>

                {/* ROW 2: flags (full width) */}
                <div className="col-span-12 flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 md:pt-3">
                  {canWonLost && (
                    <>
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!status.isWon}
                          onChange={(e) => handleToggleWon(index, e.target.checked)}
                        />
                        Won
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!status.isLost}
                          onChange={(e) => handleToggleLost(index, e.target.checked)}
                        />
                        Lost
                      </label>
                    </>
                  )}
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!status.isFollowUpStage}
                      onChange={(e) => handleToggleFollowUp(index, e.target.checked)}
                    />
                    Follow-up
                  </label>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={handleAddStatus}
          className="text-sm font-semibold text-blue-600"
        >
          + Add Status
        </button>
      </div>
    </div>
  );
}
