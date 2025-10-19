import React from 'react';

export default function StageEditor({ stageKey, title, note = '', statuses, onUpdate }) {
  const handleNameChange = (index, newName) => {
    const next = [...statuses];
    next[index] = { ...next[index], name: newName };
    onUpdate(stageKey, next);
  };

  const handleColorChange = (index, newColor) => {
    const next = [...statuses];
    next[index] = { ...next[index], color: newColor || '' };
    onUpdate(stageKey, next);
  };

  const handleResetColor = (index) => {
    const next = [...statuses];
    next[index] = { ...next[index], color: '' };
    onUpdate(stageKey, next);
  };

  const handleAddStatus = () => {
    const uid = () => (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) + Date.now().toString(36);
    const next = [
      ...statuses,
      { _id: uid(), name: 'New Status', category: stageKey, color: '' },
    ];
    onUpdate(stageKey, next);
  };
  

  const handleDelete = (index) => {
    const next = statuses.filter((_, i) => i !== index);
    onUpdate(stageKey, next);
  };

  const handleMove = (index, direction) => {
    if ((index === 0 && direction === -1) || (index === statuses.length - 1 && direction === 1)) return;
    const next = [...statuses];
    const [item] = next.splice(index, 1);
    next.splice(index + direction, 0, item);
    onUpdate(stageKey, next);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {note && <p className="text-slate-500 text-sm mt-1">{note}</p>}

      <div className="mt-4 space-y-2">
        {statuses.map((status, index) => {
          const color = status.color || '';
          return (
            <div key={status._id || index} className="flex items-center gap-2 p-2 border rounded-md bg-white">
              {/* Color picker */}
              <div className="shrink-0">
                <input
                  type="color"
                  value={color || '#000000'}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  className="h-8 w-8 p-0 border rounded cursor-pointer"
                  title="Choose color"
                />
              </div>

              {/* Name input */}
              <input
                type="text"
                value={status.name}
                onChange={(e) => handleNameChange(index, e.target.value)}
                style={{ color: color || undefined }}
                className="flex-1 min-w-0 p-1 rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400"
                placeholder="Status name"
              />

              {/* Reset */}
              <button
                type="button"
                onClick={() => handleResetColor(index)}
                className="shrink-0 px-2 py-1 text-xs rounded border border-slate-300 hover:bg-slate-50"
                title="Reset color"
              >
                Reset
              </button>

              {/* Move/Delete */}
              <div className="shrink-0 flex items-center">
                <button type="button" onClick={() => handleMove(index, -1)} disabled={index === 0} className="p-1 disabled:opacity-20">↑</button>
                <button type="button" onClick={() => handleMove(index, 1)} disabled={index === statuses.length - 1} className="p-1 disabled:opacity-20">↓</button>
                <button type="button" onClick={() => handleDelete(index)} className="p-1 text-red-500 ml-2">×</button>
              </div>
            </div>
          );
        })}

        <button type="button" onClick={handleAddStatus} className="text-sm font-semibold text-blue-600 mt-2">
          + Add Status
        </button>
      </div>
    </div>
  );
}
