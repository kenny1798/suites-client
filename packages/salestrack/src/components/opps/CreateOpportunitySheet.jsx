// packages/salestrack/src/ui/opps/CreateOpportunitySheet.jsx
import React, { useEffect, useState } from 'react';
import { toolsApi } from '@suite/api-clients';

export default function CreateOpportunitySheet({ teamId, onClose, onCreated }) {
  const [submitting, setSubmitting] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({
    name: '',
    value: '',
    contactId: '',
  });

  useEffect(() => {
    let alive = true;
    async function loadContacts() {
      try {
        const res = await toolsApi.get(`/api/salestrack/contacts?teamId=${teamId}`);
        if (!alive) return;
        setContacts(res?.data || []);
      } catch (e) {
        console.error('Load contacts failed', e?.response?.data || e);
      }
    }
    loadContacts();
    return () => { alive = false; };
  }, [teamId]);

  const valueToCents = (val) => {
    if (val == null || val === '') return 0;
    const n = Number(String(val).replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
    };

  async function submit(e) {
    e.preventDefault();
    if (!teamId) return;
    setSubmitting(true);
    try {
      await toolsApi.post(`/api/salestrack/opportunities`, {
        name: String(form.name || '').trim(),
        value: valueToCents(form.value),
        contactId: form.contactId ? Number(form.contactId) : null,
        teamId,
      });
      onCreated?.();
    } catch (e) {
      console.error('Create opportunity failed:', e?.response?.data || e);
      alert(e?.response?.data?.error || 'Failed to create opportunity');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:w-[420px] bg-white rounded-t-2xl md:rounded-l-2xl shadow-xl p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Create Opportunity</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="e.g. Acme – Annual Plan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Value (MYR)</label>
            <input
              value={form.value}
              onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="e.g. 12000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contact</label>
            <select
              value={form.contactId}
              onChange={(e) => setForm(f => ({ ...f, contactId: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Select a contact…</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.email ? `– ${c.email}` : ''}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Contact mesti dalam team yang sama.</p>
          </div>

          <div className="pt-2">
            <button
              disabled={submitting}
              className="w-full rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-black disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
