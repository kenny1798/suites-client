// packages/salestrack/src/pages/OpportunitiesPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { toolsApi } from '@suite/api-clients';
import { useTeam } from '@suite/core-context';
import CreateOpportunitySheet from '../components/opps/CreateOpportunitySheet.jsx';
import OpportunityCard from '../components/opps/OpportunityCard.jsx';
import { combinePhone } from '../utils/combinePhone.js';
import { ConfirmDialog } from '@suite/ui';


const money = new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 });

export default function OpportunitiesPage() {
  const { activeTeam } = useTeam();
  const teamId = activeTeam?.id;

  const [scope, setScope] = useState('active');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [items, setItems] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [view, setView] = useState('ACTIVE');

  const [confirm, setConfirm] = useState({
    open: false, title: '', message: '', danger: false, onConfirm: null
  });


  function askConfirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) {
    return new Promise((resolve) => {
      setConfirm({ open: true, title, message, confirmText, cancelText, resolve });
    });
  }
  const handleConfirmOk = () => { confirm.resolve?.(true); setConfirm(c => ({ ...c, open:false })); };
  const handleConfirmCancel = () => { confirm.resolve?.(false); setConfirm(c => ({ ...c, open:false })); };


  // UI filters
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // id | 'ALL'
  const [catFilter, setCatFilter] = useState('ALL');       // 'ALL' | 'Prospect' | 'Deal' | 'Outcome' | 'Ongoing'
  const [sortKey, setSortKey] = useState('createdAt_desc'); // 'value_desc'|'value_asc'|'createdAt_desc'|'createdAt_asc'

  // fetch pipeline + opps
  async function load() {
    if (!teamId) return;
    setLoading(true);
    try {
      const [stRes, oppRes, delRes] = await Promise.all([
        toolsApi.get(`/api/salestrack/teams/${teamId}/statuses`),
        toolsApi.get(`/api/salestrack/opportunities`, { params: { teamId, scope } }),
        toolsApi.get(`/api/salestrack/opportunities/deleted`, { params: { teamId } }),
      ]);
      setStatuses(stRes?.data || []);
      setItems(oppRes?.data || []);
      setDeletedItems(delRes?.data || []);
    } catch (e) {
      console.error('Failed to load opportunities:', e?.response?.data || e);
    } finally {
      setLoading(false);
    }
  }

  async function doDelete(opp) {
    await toolsApi.delete(`/api/salestrack/opportunities/${opp.id}`, { data: { teamId } });
    setItems(prev => prev.filter(x => x.id !== opp.id));
  }
  function handleDelete(opp) {
    if (!teamId || !opp?.id) return;
    setConfirm({
      open: true,
      title: 'Delete opportunity?',
      message: `“${opp.name}” will be moved to Deleted.\nYou can restore it later.`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try { await doDelete(opp); } finally { closeConfirm(); }
      }
    });
  }

  async function handleRestore(opp) {
    if (!teamId || !opp?.id) return;
    // guna ConfirmDialog kalau kau dah setup, atau window.confirm
    const ok = await askConfirm?.({
      title: 'Restore opportunity?',
      message: `“${opp.name}” will be moved back to Active.`,
      confirmText: 'Restore',
    }) ?? window.confirm(`Restore "${opp.name}"?`);
    if (!ok) return;
    try {
      await toolsApi.post(`/api/salestrack/opportunities/${opp.id}/restore`, { teamId });
      await load(); // refresh senarai Deleted
    } catch (e) {
      console.error(e?.response?.data || e);
      alert('Failed to restore opportunity.');
    }
  }
 




  useEffect(() => { load(); /* eslint-disable-next-line */ }, [teamId, scope]);

  const filtered = useMemo(() => {
    let list = Array.isArray(items) ? [...items] : [];
    // filter by search
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      const needleDigits = q.replace(/\D+/g, '');
      list = list.filter(x => {
        const { digits: phoneDigits } = combinePhone(x?.Contact?.phonecc, x?.Contact?.phone);
        return(
        x.name?.toLowerCase().includes(needle) ||
        x?.Contact?.name?.toLowerCase().includes(needle) ||
        (needleDigits.length >= 1 && phoneDigits.includes(needleDigits))
      )
      });
    }
    // filter by category
    if (catFilter !== 'ALL') {
      list = list.filter(x => x?.OpportunityStatus?.category === catFilter);
    }
    // filter by status id
    if (statusFilter !== 'ALL') {
      list = list.filter(x => String(x.statusId) === String(statusFilter));
    }
    // sort
    list.sort((a, b) => {
      switch (sortKey) {
        case 'value_desc': return (b.value || 0) - (a.value || 0);
        case 'value_asc':  return (a.value || 0) - (b.value || 0);
        case 'createdAt_asc':  return new Date(a.createdAt) - new Date(b.createdAt);
        case 'createdAt_desc':
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return list;
  }, [items, q, catFilter, statusFilter, sortKey]);

  const categories = ['ALL', 'Prospect', 'Deal', 'Outcome', 'Ongoing'];

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
        <h1 className="text-xl font-semibold">Opportunities</h1>
        <p className="text-sm text-gray-500">Lead → Deal → Outcome → Ongoing</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium bg-white hover:bg-gray-50"
        >
          + Create
        </button>
      </div>

      {/* Filters */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <select value={scope} onChange={(e)=>setScope(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
            <option value="active">Active</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
        <div className="col-span-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search opportunity, contact or phone…"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="ALL">All Stages</option>
            {statuses.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.category})
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="createdAt_desc">Newest</option>
            <option value="createdAt_asc">Oldest</option>
            <option value="value_desc">Value: High → Low</option>
            <option value="value_asc">Value: Low → High</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="mt-4">
        {loading ? (
          <div className="text-gray-500 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-gray-500">
            No opportunities yet. Create your first one!
          </div>
        ) : (
          <>
          <div className="rounded-lg my-4 text-sm text-start text-gray-500 italic">
          {view === 'ACTIVE' ? 'Click card to view details' : 'These are soft-deleted. You can restore them.'}
          </div>
          <ul className="space-y-3">
          {(view === 'ACTIVE' ? filtered : deletedItems).map(o => (
              <li key={o.id}>
                <OpportunityCard
                  opp={o}
                  statusColor={o?.OpportunityStatus?.color}
                  statusName={o?.OpportunityStatus?.name}
                  contactName={o?.Contact?.name}
                  valueFmt={money.format((o.value || 0) / 100)}
                  mode={scope === 'deleted' ? 'deleted' : 'active'}
                  {...(scope === 'deleted'
                       ? { onRestore: handleRestore }
                       : { onDelete: handleDelete })}
             
                  deleted={view === 'DELETED'}
                  onRestore={handleRestore}
                />
              </li>
            ))}
          </ul>
          </>
        )}
      </div>

      {/* Create Sheet */}
      {creating && (
        <CreateOpportunitySheet
          teamId={teamId}
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); load(); }}
        />
      )}

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        danger={confirm.danger}
        onConfirm={handleConfirmOk}
        onCancel={handleConfirmCancel}
      />


    </div>
  );
}
