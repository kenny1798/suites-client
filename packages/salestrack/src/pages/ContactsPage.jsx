// packages/salestrack/src/pages/ContactsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useTeam } from '@suite/core-context';
import { toolsApi } from '@suite/api-clients';
import PhoneInput from '../components/PhoneInput';
import { cleanPhone } from '../utils/phone';


const VIEW_KEY = 'st_contacts_view';

function cls(...xs){ return xs.filter(Boolean).join(' '); }
function formatPhone(cc, phone){
  const a = String(cc||'').trim(), b = String(phone||'').trim();
  if (!a && !b) return '—';
  return a && b ? `+${a}${b}` : (a || b);
}

function rmToCents(v) {
  // terima "123.45" / "123" / "RM 123.45" -> integer sen
  const n = String(v || '')
    .replace(/[^\d.]/g, '')
    .trim();
  const f = n === '' ? 0 : parseFloat(n);
  return Math.round(f * 100);
}

export default function ContactsPage() {
  const { activeTeam } = useTeam();
  const teamId = activeTeam?.id;

  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || 'cards');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  function persistView(v){ setView(v); localStorage.setItem(VIEW_KEY, v); }

  async function load(){
    if (!teamId) return;
    setLoading(true);
    try{
      const res = await toolsApi.get('/api/salestrack/contacts', { params: { teamId } });
      setItems(Array.isArray(res.data) ? res.data : []);
      setErr(null);
    }catch(e){
      setErr(e?.response?.data?.error || 'Failed to fetch contacts.');
    }finally{ setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [teamId]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(c =>
      `${c.name} ${c.email||''} ${c.phonecc||''} ${c.phone||''} ${c.source||''}`.toLowerCase().includes(s)
    );
  }, [items, q]);

  return (
    <div className="p-6 space-y-5">
      {/* Top header: title + Add button */}
      <header className="flex items-center justify-between">
        <div>
        <h1 className="text-xl font-semibold">Contacts</h1>
        <p className="text-sm text-gray-500">Manage and track all your leads in one place</p>
        </div>
        <button
          onClick={()=>setOpenAdd(true)}
          className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium bg-white hover:bg-gray-50"
        >
          Add Contact
        </button>
      </header>

      {/* Controls row (search + view toggle) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          className="border rounded-lg px-3 py-1.5 text-sm w-full sm:w-80"
          placeholder="Search name/email/phone/source"
          value={q} onChange={e=>setQ(e.target.value)}
        />
        <div className="inline-flex rounded-lg border overflow-hidden self-start">
        <button
            className={cls('px-3 py-1.5 text-sm', view==='cards' ? 'bg-black text-white' : 'bg-white')}
            onClick={()=>persistView('cards')}
          >Cards</button>
          <button
            className={cls('px-3 py-1.5 text-sm', view==='table' ? 'bg-black text-white' : 'bg-white')}
            onClick={()=>persistView('table')}
          >Table</button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : err ? (
        <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">{err}</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500">No contacts found.</div>
      ) : view === 'table' ? (
        <div className="overflow-x-auto bg-white border rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Source</Th><Th>Action</Th></tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <Td>{c.name}</Td>
                  <Td>{c.email || '—'}</Td>
                  <Td>{formatPhone(c.phonecc, c.phone)}</Td>
                  <Td >{c.source || '—'}</Td>
                  <Td className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing(c)}
                      className="ml-auto px-2 py-1 text-xs rounded border hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white border rounded-xl p-4 space-y-2">
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-gray-600">{c.email || '—'}</div>
              <div className="text-sm text-gray-600">{formatPhone(c.phonecc, c.phone)}</div>
              <div className="text-xs text-gray-500">Source: {c.source || '—'}</div>

              <div className="pt-2">
                <button
                  onClick={() => setEditing(c)}
                  className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      {openAdd && (
        <AddContactModal
          teamId={teamId}
          onClose={()=>setOpenAdd(false)}
          onImported={async()=>{ setOpenAdd(false); await load(); }}
        />
      )}

        {editing && (
          <EditContactModal
            teamId={teamId}
            contact={editing}
            onClose={() => setEditing(null)}
            onChanged={async () => { setEditing(null); await load(); }}
          />
        )}
    </div>
  );
}

function Th({children}){ return <th className="text-left p-2 border-b font-medium text-gray-600">{children}</th>; }
function Td({children}){ return <td className="p-2">{children}</td>; }

/* ======================= Modal + Tabs ======================= */

function AddContactModal({ teamId, onClose, onImported }) {
  const [tab, setTab] = useState('single'); // 'single' | 'bulk'

  return (
    <Modal onClose={onClose} title='Add Contact'>
        <div className="px-4 pt-3">
          <div className="inline-flex rounded-lg border overflow-hidden mb-4">
            <button
              onClick={() => setTab('single')}
              className={cls('px-3 py-1.5 text-sm', tab === 'single' ? 'bg-black text-white' : 'bg-white')}
            >
              Single Upload
            </button>
            <button
              onClick={() => setTab('bulk')}
              className={cls('px-3 py-1.5 text-sm', tab === 'bulk' ? 'bg-black text-white' : 'bg-white')}
            >
              Bulk CSV
            </button>
          </div>
        </div>

        <div className="p-4">
          {tab === 'single' ? (
            <SingleForm teamId={teamId} onClose={onClose} onDone={onImported} />
          ) : (
            <BulkCsvImporter teamId={teamId} onDone={onImported} />
          )}
        </div>
      
    </Modal>
  );
}

function SingleForm({ teamId, onDone, onClose }) {
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    source: '',
    phonecc: '60',
    phone: '',
    iso: 'MY',
  });

  // --- create-opportunity toggle + fields ---
  const [createOpp, setCreateOpp] = React.useState(false);
  const [opp, setOpp] = React.useState({ name: '', value: '', statusId: '' });
  const [statuses, setStatuses] = React.useState([]);
  const [loadingStatuses, setLoadingStatuses] = React.useState(false);

  React.useEffect(() => {
    if (!createOpp || !teamId) return;
    let alive = true;
    (async () => {
      try {
        setLoadingStatuses(true);
        const res = await toolsApi.get(`/api/salestrack/teams/${teamId}/statuses`);
        if (!alive) return;
        const arr = Array.isArray(res?.data) ? res.data : [];
        setStatuses(arr);
        // default pilih stage pertama
        if (arr.length && !opp.statusId) {
          setOpp(o => ({ ...o, statusId: arr[0].id }));
        }
      } finally {
        if (alive) setLoadingStatuses(false);
      }
    })();
    return () => { alive = false; };
  }, [createOpp, teamId]); // eslint-disable-line

  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  async function save(e) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      // 1) Create contact
      const contactRes = await toolsApi.post('/api/salestrack/contacts', {
        teamId,
        name: form.name,
        email: form.email || null,
        source: form.source || null,
        phonecc: form.phonecc,
        phone: form.phone, // PhoneInput dah normalise (nombor sahaja + buang leading 0)
      });
      const contact = contactRes.data;

      // 2) Optionally create opportunity
      if (createOpp) {
        const payload = {
          teamId,
          contactId: contact.id,
          name: opp.name?.trim() || form.name, // fallback guna nama contact
          value: rmToCents(opp.value || 0),
          statusId: opp.statusId || (statuses[0]?.id ?? null),
        };
        await toolsApi.post('/api/salestrack/opportunities', payload);
      }

      onDone?.();   // parent akan reload list & tutup modal
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Failed to create contact.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="grid grid-cols-1 gap-4">
      {err && (
        <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 text-sm">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Name *"
          value={form.name}
          onChange={(v) => setForm(s => ({ ...s, name: v }))}
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm(s => ({ ...s, email: v }))}
        />

        {/* Phone row spans full on small, half on md */}
        <div className="md:col-span-2">
          <PhoneInput
            value={{ phonecc: form.phonecc, phone: form.phone, iso: form.iso }}
            onChange={(v) => setForm(s => ({ ...s, ...v }))}
            required
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Source"
            value={form.source}
            onChange={(v) => setForm(s => ({ ...s, source: v }))}
          />
        </div>
      </div>

      {/* Toggle create opportunity */}
      <label className="flex items-center gap-2 select-none">
        <input
          type="checkbox"
          className="rounded border-gray-300"
          checked={createOpp}
          onChange={(e) => setCreateOpp(e.target.checked)}
        />
        <span className="text-sm text-gray-800">Create opportunity now</span>
      </label>

      {createOpp && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border rounded-lg p-3 bg-gray-50">
          <Input
            label="Opportunity name"
            placeholder={form.name || 'Untitled'}
            value={opp.name}
            onChange={(v) => setOpp(s => ({ ...s, name: v }))}
            className="md:col-span-2"
          />
          <Input
            label="Value (RM)"
            placeholder="0.00"
            inputMode="decimal"
            value={opp.value}
            onChange={(v) => {
              // benarkan nombor & titik sahaja
              const x = String(v).replace(/[^0-9.]/g, '');
              setOpp(s => ({ ...s, value: x }));
            }}
          />

          <div className="md:col-span-3">
            <label className="space-y-1 w-full">
              <div className="text-sm text-gray-700">Stage</div>
              <select
                disabled={loadingStatuses}
                className="w-full border rounded-lg px-3 py-2 bg-white"
                value={opp.statusId || ''}
                onChange={(e) => setOpp(s => ({ ...s, statusId: Number(e.target.value) }))}
              >
                {statuses.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="px-3 py-2 rounded border">
          Cancel
        </button>
        <button disabled={saving} className="px-4 py-2 rounded bg-black text-white">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function BulkCsvImporter({ teamId, onDone }) {
  const [rows, setRows] = useState([]);  // [{name,email,phonecc,phone,source}]
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  function parseCsv(text) {
    const sep = text.includes(';') && !text.includes(',') ? ';' : ',';
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return [];
    const headers = lines[0].split(sep).map(h => h.trim().toLowerCase());
    const ix = (k) => headers.indexOf(k);
    const out = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(sep).map(x => x.trim());
      out.push({
        name:   cols[ix('name')]   || '',
        email:  cols[ix('email')]  || '',
        phonecc:cols[ix('phonecc')]|| '',
        phone:  cols[ix('phone')]  || '',
        source: cols[ix('source')] || '',
      });
    }
    return out.filter(r => r.name && r.phone && r.phonecc);
  }

  async function handleFile(e) {
    setErr(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCsv(text);
    if (!parsed.length) {
      setErr('No valid rows found. Required headers: name,email,phonecc,phone,source');
    }
    setRows(parsed);
  }

  async function importAll() {
    if (!teamId || !rows.length) return;
    setBusy(true); setErr(null);
    let ok = 0, fail = 0;
    for (const r of rows) {
      try {
        await toolsApi.post('/api/salestrack/contacts', { ...r, teamId });
        ok++;
      } catch {
        fail++;
      }
    }
    if (fail === 0) onDone?.();
    else {
      setBusy(false);
      setErr(`Imported ${ok} rows. ${fail} failed (likely duplicates/invalid).`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Upload a CSV with headers: <code className="bg-gray-50 px-1 rounded">name,email,phonecc,phone,source</code>
      </div>
      <input type="file" accept=".csv,text/csv" onChange={handleFile} />
      {err && <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">{err}</div>}

      {rows.length > 0 && (
        <>
          <div className="text-sm text-gray-700">{rows.length} row(s) ready to import.</div>
          <div className="max-h-56 overflow-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Source</Th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <Td>{r.name}</Td>
                    <Td>{r.email || '—'}</Td>
                    <Td>{`${r.phonecc || ''} ${r.phone || ''}`.trim() || '—'}</Td>
                    <Td>{r.source || '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <button disabled={busy} onClick={importAll} className="px-4 py-2 rounded-lg bg-black text-white">
              {busy ? 'Importing…' : 'Import'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function EditContactModal({ teamId, contact, onClose, onChanged }) {
  const [tab, setTab] = useState('details'); // 'details' | 'quickopp' | 'timeline'
  const tabs = [
    { id: 'details',   label: 'Details' },
    { id: 'quickopp',  label: 'Quick Opportunity' },
    { id: 'timeline',  label: 'Timeline' },
  ];

  return (
    <Modal onClose={onClose} title='Edit Contact'>
        <div className="px-4 pt-3">
          <div className="inline-flex rounded-lg border overflow-hidden mb-4">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 text-sm ${tab===t.id ? 'bg-black text-white' : 'bg-white'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {tab === 'details' && (
            <EditDetails
              teamId={teamId}
              initial={contact}
              onClose={onClose}
              onSaved={onChanged}
            />
          )}
          {tab === 'quickopp' && (
            <QuickOpportunity
              teamId={teamId}
              contact={contact}
              onCreated={onChanged}
            />
          )}
          {tab === 'timeline' && (
            <ContactTimeline
              teamId={teamId}
              contactId={contact.id}
            />
          )}
        </div>
      
    </Modal>
  );
}

/* -------- Tab 1: edit details -------- */
function EditDetails({ teamId, initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    email: initial.email || '',
    source: initial.source || '',
    phonecc: initial.phonecc || '',
    phone: initial.phone || '',
    iso: initial.iso || 'MY',
  });
  const [saving, setSaving] = useState(false);

  async function save(e){
    e.preventDefault();
    setSaving(true);
    try{
      await toolsApi.put(`/api/salestrack/contacts/${initial.id}`, {
        teamId,
        name: form.name,
        email: form.email || null,
        source: form.source || null,
        phone: cleanPhone(form.phone) || null,
        phonecc: form.phonecc || null
      });
      onSaved?.();
    }catch(err){
      alert(err?.response?.data?.error || 'Failed to update contact.');
    }finally{ setSaving(false); }
  }

  return (
    <form onSubmit={save} className="grid grid-cols-1 gap-4">
      <Input
        label="Name *"
        value={form.name}
        onChange={(v)=>setForm(s=>({...s, name:v}))}
        required
      />
      <Input
        label="Email"
        value={form.email}
        onChange={(v)=>setForm(s=>({...s, email:v}))}
        type="email"
      />
      <PhoneInput
        label={`Phone Number${form.phonecc ? `: ${form.phonecc}` : ''}`}
        value={{ phonecc: form.phonecc, phone: form.phone, iso: form.iso }}
        onChange={(v)=>setForm(s=>({...s, ...v}))}
      />
      <Input
        label="Source"
        value={form.source}
        onChange={(v)=>setForm(s=>({...s, source:v}))}
      />
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
        <button disabled={saving} className="px-4 py-2 rounded bg-black text-white">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

/* -------- Tab 2: quick opportunity -------- */
function QuickOpportunity({ teamId, contact, onCreated }) {
  const [statuses, setStatuses] = useState([]);
  const [form, setForm] = useState({
    name: contact.name || '',
    value: '', // RM (we’ll convert to cents)
    statusId: '',
  });
  const [busy, setBusy] = useState(false);
  const me = Number(localStorage.getItem('userId')); // optional if backend needs assignee

  useEffect(() => {
    let alive = true;
    (async () => {
      try{
        const r = await toolsApi.get(`/api/salestrack/teams/${teamId}/statuses`);
        if (alive) setStatuses(r.data || []);
      }catch(_){}
    })();
    return () => { alive = false; };
  }, [teamId]);

  async function create(e){
    e.preventDefault();
    if (!form.name || !form.statusId) return;
    setBusy(true);
    try{
      // value: transform RM -> cents (int)
      const cents = Math.round((Number(form.value || 0) || 0) * 100);
      await toolsApi.post('/api/salestrack/opportunities', {
        teamId,
        contactId: contact.id,
        name: form.name,
        value: cents,
        statusId: Number(form.statusId) || undefined,
        assigneeId: me || undefined, // safely optional
      });
      onCreated?.();
    }catch(err){
      alert(err?.response?.data?.error || 'Failed to create opportunity.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Opportunity name *"
        value={form.name}
        onChange={(v)=>setForm(s=>({...s, name:v}))}
        required
      />
      <Input
        label="Value (RM)"
        value={form.value}
        onChange={(v)=>setForm(s=>({...s, value:v}))}
        inputMode="decimal"
        placeholder="0.00"
      />
      <label className="space-y-1">
        <div className="text-sm text-gray-700">Stage *</div>
        <select
          required
          value={form.statusId}
          onChange={e=>setForm(s=>({...s, statusId:e.target.value}))}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">Choose stage…</option>
          {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>

      <div className="md:col-span-2 flex justify-end gap-2 pt-2">
        <button disabled={busy} className="px-4 py-2 rounded bg-black text-white">
          {busy ? 'Creating…' : 'Create Opportunity'}
        </button>
      </div>
    </form>
  );
}

/* -------- Tab 3: contact timeline (by opportunity) -------- */
function ContactTimeline({ teamId, contactId }) {
  const [opps, setOpps] = useState([]);
  const [oppId, setOppId] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // load opps for this contact
  useEffect(() => {
    let alive = true;
    (async () => {
      try{
        const r = await toolsApi.get('/api/salestrack/opportunities', {
          params: { teamId, contactId }
        });
        const list = r.data || [];
        if (!alive) return;
        setOpps(list);
        setOppId(list[0]?.id ? String(list[0].id) : '');
      }catch(_){
        if (!alive) return;
        setOpps([]); setOppId('');
      }
    })();
    return () => { alive = false; };
  }, [teamId, contactId]);

  // load timeline when opp changes
  useEffect(() => {
    let alive = true;
    if (!oppId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    (async () => {
      try{
        const r = await toolsApi.get(`/api/salestrack/opportunities/${oppId}/timeline`, {
          params: { teamId }
        });
        if (!alive) return;
        setItems(r.data?.items || []);
      }catch(_){
        if (!alive) return;
        setItems([]);
      }finally{
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [teamId, oppId]);

  return (
    <div className="space-y-4">
      <label className="space-y-1 block">
        <div className="text-sm text-gray-700">Opportunity</div>
        <select
          value={oppId}
          onChange={e=>setOppId(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          {opps.length === 0 && <option value="">No opportunities</option>}
          {opps.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </label>

      <div className="border rounded-xl p-3">
        <h3 className="font-medium mb-2">Timeline</h3>
        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-gray-500">No timeline yet.</div>
        ) : (
          <ul className="space-y-3">
            {items.map((it, i) => (
              <li key={i} className="rounded-lg border p-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-gray-100 font-medium">{it.kind}</span>
                  </span>
                  <span>{fmtDate(it.at)}</span>
                </div>
                <div className="text-sm mt-1">{renderTL(it)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// reuse your timeline text helpers (paste from OpportunityDetail if needed)
function renderTL(it) {
  const d = it.data || {};
  if (it.kind === 'STATUS_CHANGE') {
    const to   = d?.details?.to?.name   || '—';
    const from = d?.details?.from?.name || '—';
    return `Stage: ${from} → ${to}`;
  }
  if (it.kind === 'ACTIVITY') {
    return `Activity ${d.type}${d.outcome ? ` – ${d.outcome}` : d.notes ? ` – ${d.notes}` : ''}`;
  }
  if (it.kind === 'TASK') {
    return `Task ${d.type} • ${d.status}${d.dueAt ? ` • due ${fmtDate(d.dueAt)}` : ''}`;
  }
  if (it.kind === 'NOTE') return 'Note added';
  if (it.kind === 'FOLLOWUP_ATTEMPT') return `Follow-up attempt${d.cause ? ` (${d.cause})` : ''}`;
  if (it.kind === 'OPP_CREATED') return `Opportunity created: “${d?.details?.name || ''}”`;
  return JSON.stringify(d);
}
function fmtDate(s) { const dt = s ? new Date(s) : null; return dt ? dt.toLocaleString() : '—'; }


/* ---------------- small UI atoms ---------------- */
function Modal({ onClose, children, title = '' }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-[96vw] max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="font-semibold">{title}</div>
            <button className="text-gray-500 hover:text-black" onClick={onClose}>✕</button>
          </div>

          {/* Body (scrolls) */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value = '', onChange, className = '', ...props }) {
  return (
    <label className={`space-y-1 w-full ${className}`}>
      <div className="text-sm text-gray-700">{label}</div>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      />
    </label>
  );
}

