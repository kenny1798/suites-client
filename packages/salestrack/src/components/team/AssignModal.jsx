import React from 'react';

export default function AssignModal({
  open,
  onClose,
  managers = [],          // [{id, name, email}]
  memberName = 'Member',
  onAssign,               // (managerUserId: string|number) => Promise|void
  loading = false,
}) {
  if (!open) return null;

  // state untuk pilihan manager
  const [selected, setSelected] = React.useState('');

  // reset pilihan setiap kali modal dibuka
  React.useEffect(() => {
    if (open) setSelected('');
  }, [open]);

  // normalize list (unique by id + label fallback)
  const managerList = React.useMemo(() => {
    const map = new Map();
    (managers || []).forEach((m) => {
      const id = m?.id ?? m?.User?.id; // guard kalau backend tersilap shape
      if (!id) return;
      const name = m?.name ?? m?.User?.name ?? null;
      const email = m?.email ?? m?.User?.email ?? '';
      map.set(String(id), { id: String(id), label: name || email || `User #${id}` });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [managers]);

  const handleConfirm = async () => {
    if (!selected || typeof onAssign !== 'function') return;
    await onAssign(selected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="text-lg font-semibold">Assign Member</div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">×</button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-slate-600">
            Assign <b>{memberName}</b> to a manager.
          </p>

          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={loading}
          >
            <option value="">— Select Manager —</option>
            {managerList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border rounded">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || loading}
            className="px-3 py-1.5 text-sm rounded text-white bg-slate-900 disabled:opacity-50"
          >
            {loading ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
