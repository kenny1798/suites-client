// salestrack/src/pages/ContactsContent.jsx
import { useEffect, useState } from 'react';
import { toolsApi } from '@suite/api-clients';

export default function ContactsContent({ teamId }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: '' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await toolsApi.get('/api/salestrack/contacts', { params: { teamId } });
      setItems(res.data || []);
      setErr(null);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to fetch contacts.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { if (teamId) load(); }, [teamId]);

  async function submit(e) {
    e.preventDefault();
    try {
      await toolsApi.post('/api/salestrack/contacts', { ...form, teamId });
      setForm({ name: '', email: '', phone: '', source: '' });
      await load();
    } catch (e2) {
      alert(e2?.response?.data?.error || 'Failed to create contact.');
    }
  }

  const filtered = items.filter(c => {
    const s = `${c.name} ${c.email || ''} ${c.phone || ''}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Contacts</h1>
        <input
          className="border rounded-lg px-3 py-1.5 text-sm w-64"
          placeholder="Search name/email/phone"
          value={q} onChange={e => setQ(e.target.value)}
        />
      </header>

      <form onSubmit={submit} className="grid sm:grid-cols-5 gap-2 bg-white border rounded-xl p-3">
        <input className="border rounded px-2 py-1.5" placeholder="Name"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        <input className="border rounded px-2 py-1.5" placeholder="Email"
          value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <input className="border rounded px-2 py-1.5" placeholder="Phone"
          value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        <input className="border rounded px-2 py-1.5" placeholder="Source"
          value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
        <button className="bg-black text-white rounded px-3 py-1.5">Add</button>
      </form>

      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : err ? (
        <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">{err}</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500">No contacts found.</div>
      ) : (
        <div className="overflow-x-auto bg-white border rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Source</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <Td>{c.name}</Td>
                  <Td>{c.email || '-'}</Td>
                  <Td>{c.phone || '-'}</Td>
                  <Td>{c.source || '-'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }) { return <th className="text-left p-2 border-b font-medium text-gray-600">{children}</th>; }
function Td({ children }) { return <td className="p-2">{children}</td>; }
