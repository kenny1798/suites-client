import React from 'react';
import { apiAuth } from '@suite/api-clients';

export default function EditBillingCustomerModal({
  open,
  onClose,
  initial,        // { billName, billEmail, billCompany, billAddress }
  onSaved,        // cb(payloadFromServer)
}) {
  const [form, setForm] = React.useState({
    billName: '',
    billEmail: '',
    billCompany: '',
    billAddress: '',
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (open) {
      setForm({
        billName: initial?.billName || '',
        billEmail: initial?.billEmail || '',
        billCompany: initial?.billCompany || '',
        billAddress: initial?.billAddress || '',
      });
      setError(null);
    }
  }, [open, initial]);

  if (!open) return null;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const save = async () => {
    // simple validate
    if (!form.billEmail?.includes('@')) {
      setError('Please enter a valid billing email.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data } = await apiAuth.put('/billing/me/customer', form);
      onSaved?.(data);
      onClose?.();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Billing Details</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>

        {error && <div className="mb-3 text-sm text-rose-600">{error}</div>}

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Name</label>
            <input
              name="billName"
              value={form.billName}
              onChange={onChange}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Billing contact name"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Email</label>
            <input
              name="billEmail"
              value={form.billEmail}
              onChange={onChange}
              className="w-full rounded-md border px-3 py-2"
              placeholder="billing@email.com"
              type="email"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Company (optional)</label>
            <input
              name="billCompany"
              value={form.billCompany}
              onChange={onChange}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Company / Organization"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Address (optional)</label>
            <textarea
              name="billAddress"
              value={form.billAddress}
              onChange={onChange}
              rows={4}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Full billing address"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-md px-4 py-2 text-slate-700 border border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className={`rounded-md px-4 py-2 font-semibold text-white ${saving ? 'bg-slate-400' : 'bg-slate-900 hover:bg-slate-700'}`}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
