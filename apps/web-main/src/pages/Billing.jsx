import React from 'react';
import { useNavigate } from 'react-router-dom';
import { apiAuth } from '@suite/api-clients';
import { useMySubs } from '@suite/hooks';
import ChangePlanModal from '../components/ChangePlanModal.jsx';
import CancelPlanModal from '../components/CancelPlanModal.jsx';
import EditBillingCustomerModal from '../components/EditBillingCustomerModal.jsx';

/**
 * Billing.jsx
 * Sections:
 *  - Your Subscriptions (tool-level)
 *  - Invoice History (with status filter + Pay Now)
 *  - Billing Account (BillingCustomer)
 */

// ------------------------------
// Small helpers
// ------------------------------
const money = (cents) => `RM ${(Number(cents || 0) / 100).toFixed(2)}`;
const formatDate = (v) => (v ? new Date(v).toLocaleDateString() : '—');
const STATUS_COLOR = {
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  trialing: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  canceled: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200',
  expired: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  unpaid: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  open: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
};
const isFuture = (v) => (v ? new Date(v) > new Date() : false);
const formatPretty = (v) =>
  v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// ------------------------------
// Fetch hooks (minimal, no external deps)
// ------------------------------
// replace your useBillingCustomer() with this version
function useBillingCustomer() {
  const [state, set] = React.useState({ loading: true, data: null, error: null });

  const fetcher = React.useCallback(async () => {
    try {
      const { data } = await apiAuth.get('/billing/me/customer');
      set({ loading: false, data, error: null });
    } catch (e) {
      set({ loading: false, data: null, error: e?.response?.data?.error || e.message });
    }
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await apiAuth.get('/billing/me/customer');
        if (alive) set({ loading: false, data, error: null });
      } catch (e) {
        if (alive) set({ loading: false, data: null, error: e?.response?.data?.error || e.message });
      }
    })();
    return () => { alive = false; };
  }, []);

  const refetch = React.useCallback(() => fetcher(), [fetcher]);
  return { ...state, refetch };
}


function useInvoices() {
  const [state, set] = React.useState({ loading: true, items: [], error: null });
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await apiAuth.get('/billing/me/invoices');
        if (!alive) return;
        set({ loading: false, items: Array.isArray(data) ? data : [], error: null });
      } catch (e) {
        if (!alive) return;
        set({ loading: false, items: [], error: e?.response?.data?.error || e.message });
      }
    })();
    return () => { alive = false; };
  }, []);
  return state;
}

// ------------------------------
// Subscriptions List
// ------------------------------
function SubscriptionsSection() {
  const navigate = useNavigate();
  const { loading, map = {}, error, refetch } = useMySubs(); // jika hook ada refetch
  const items = React.useMemo(() => Object.values(map || {}), [map]);
  const [cancelTarget, setCancelTarget] = React.useState(null);
  const [busyId, setBusyId] = React.useState(null);

  // modal state
  const [cp, setCP] = React.useState({ open: false, toolSlug: null, sub: null, unpaid: false });
  const openChangePlan = (sub) => {
    setCP({ open: true, toolSlug: sub.toolId, sub, unpaid: false });
  };
  const closeChangePlan = () => setCP({ open: false, toolSlug: null, sub: null, unpaid: false });

  const handleSwitched = async (resp) => {
    // resp mungkin ada prorationDeltaCents
    const delta = Number(resp?.toolSubscription?.prorationDeltaCents || 0);
    if (delta !== 0) {
      const label = delta > 0 ? 'Prorated charge added' : 'Prorated credit applied';
      window.alert(`${label}: ${money(Math.abs(delta))}`);
    }
    if (typeof refetch === 'function') await refetch();
    else window.location.reload();
  };

  const goCancel = async () => {
    const r = await apiAuth.post('/billing/create-portal-session');
    const url = r?.data?.url;
    if (url) window.location.href = url;
  };

  const continueSub = async (sub) => {
    try {
      setBusyId(sub.id);
      const { data } = await apiAuth.post('/billing/resubscribe/from-canceled', {
        toolId: sub.toolId,
        planCode: sub.planCode,
      });
  
      const cents = Number(data?.toolSubscription?.prorationDebitCents || 0);
      if (cents > 0) {
        alert(`Resubscribed. Prorated charge added: RM ${(cents/100).toFixed(2)}`);
      } else {
        alert('Resubscribed successfully. No proration charge for the remainder of this cycle.');
      }
  
      window.location.reload();
    } catch (e) {
      const code = e?.response?.data?.error;
      if (code === 'UNPAID_INVOICE') {
        alert('There are outstanding invoices. Please settle them first.');
        navigate('/billing');
      } else if (code === 'OPEN_INVOICE_EXISTS') {
        alert('There is an open invoice with outstanding amount in this cycle. Please resolve it first.');
      } else if (code === 'INVOICE_LOCKED') {
        alert('A payment is in progress for the current cycle invoice. Complete or cancel it before resubscribing.');
      } else {
        alert(e?.response?.data?.message || 'Failed to continue subscription.');
      }
    } finally {
      setBusyId(null);
    }
  };
  

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Your Subscriptions</h2>
      {loading && <div className="text-slate-500">Loading subscriptions…</div>}
      {error && <div className="text-rose-600">Error: {String(error)}</div>}

      {!loading && !items.length && (
        <div className="rounded-lg border border-slate-200 p-4 text-slate-600">No subscriptions yet.</div>
      )}

      <div className="space-y-4">
        {items.map((sub) => {
          const status = String(sub.status || '').toLowerCase();
          const toolName = sub.Tool?.name || sub.toolId;
          const planName = sub.Plan?.name || sub.planCode;
          const trialEnds = sub.trialEnd ? new Date(sub.trialEnd) : null;
          const endAt = sub.cancelAt ? new Date(sub.cancelAt) : null;
          const scheduledCancel = status === 'active' && endAt && endAt > new Date();

          return (
            <div key={sub.id}
              className={`rounded-xl border p-4 ring-1 ${status==='active' ? 'border-emerald-200' : status==='trialing' ? 'border-indigo-200' : status==='expired' ? 'border-amber-300' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-slate-800">{toolName}</div>
                  <div className="text-slate-600">Plan: <b>{planName}</b></div>
                  {status === 'trialing' && (
                    <div className="mt-2 text-sm text-slate-500">Trial ends on <b>{formatDate(trialEnds)}</b></div>
                  )}
                  {scheduledCancel && (
                    <div className="mt-2 inline-flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 ring-1 ring-amber-200">
                        Ends on {formatPretty(endAt)}   {/* ⬅️ guna pretty */}
                      </span>
                      <span className="text-xs text-slate-500">(cancel scheduled)</span>
                    </div>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[status] || 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'}`}>{sub.status}</span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => openChangePlan(sub)}
                  className="rounded-md bg-indigo-50 text-indigo-900 font-medium py-2 hover:bg-indigo-100">
                  {status === 'trialing' ? 'Change Plan / Activate' : 'Change Plan'}
                </button>

                {status === 'active' && (
                    <button
                      onClick={() =>
                        setCancelTarget({
                          toolId: sub.toolId,
                          toolName: toolName,
                          planName: planName,
                          status: status,
                          cancelAt: sub.cancelAt, // pass ke modal
                        })
                      }
                      className={`rounded-md font-medium py-2 ${
                        scheduledCancel
                          ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'  // manage state (neutral warning)
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'      // normal cancel
                      }`}
                    >
                      {scheduledCancel ? 'Manage Cancellation' : 'Cancel'}
                    </button>
                  )}


                {/* Continue Subscription for canceled */}
                {['canceled'].includes(status) && (
                  <button
                    onClick={() => continueSub(sub)}
                    disabled={busyId === sub.id}
                    className="rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium py-2"
                  >
                    {busyId === sub.id ? 'Continuing…' : 'Continue Subscription'}
                  </button>
                )}

                {status === 'expired' && (
                  <button onClick={goCancel}
                    className="rounded-md bg-amber-50 text-amber-800 font-medium py-2 hover:bg-amber-100">
                    Clear Dues in Billing
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <ChangePlanModal
        open={cp.open}
        onClose={closeChangePlan}
        toolSlug={cp.toolSlug}
        currentSub={cp.sub}
        onSwitched={handleSwitched}
      />

  {cancelTarget && (
    <CancelPlanModal
    open={!!cancelTarget}
    onClose={() => setCancelTarget(null)}
    toolName={cancelTarget.toolName}
    toolId={cancelTarget.toolId}
    currentPlan={cancelTarget.planName}
    status={cancelTarget.status}
    cancelAt={cancelTarget.cancelAt}          // ⬅️ penting
    onCanceled={() => window.location.reload()}
  />
  )}
    </section>
  );
}

// ------------------------------
// Invoices Table
// ------------------------------
function InvoicesSection() {
  const { loading, items, error } = useInvoices();
  const [filter, setFilter] = React.useState('all');
  const [openRow, setOpenRow] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => String(i.status).toLowerCase() === filter);
  }, [items, filter]);

  const payNow = async (invoiceId) => {
    try {
      const r = await apiAuth.post(`/billing/invoices/${invoiceId}/checkout`);
      const url = r?.data?.url;
      if (url) window.location.href = url;
    } catch (e) {
      const code = e?.response?.data?.error;
      if (code === 'FAILED_TO_CREATE_CHECKOUT') {
        alert('Unable to create checkout. Please refresh and try again.');
      } else {
        alert(e?.response?.data?.message || 'Payment error. Please try again.');
      }
    }
  };

  const downloadInvoicePdf = async (invoiceId) => {
    try {
      const res = await apiAuth.get(`/billing/me/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download invoice.');
    }
  };

  return (
    <section className="mb-8">
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-xl font-semibold">Invoice History</h2>
    <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="border rounded-md px-2 py-1 text-sm">
      <option value="all">All</option>
      <option value="unpaid">Unpaid</option>
      <option value="open">Open</option>
      <option value="paid">Paid</option>
    </select>
  </div>

  {loading && <div className="text-slate-500">Loading invoices…</div>}
  {error && <div className="text-rose-600">Error: {String(error)}</div>}

  {/* responsive scroll container */}
  <div className="-mx-4 sm:mx-0 overflow-x-auto">
    <div className="inline-block min-w-full align-middle">
      <div className="rounded-xl border border-slate-200 overflow-hidden min-w-[720px]">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">INVOICE #</th>
              <th className="text-left px-4 py-3">DUE DATE</th>
              <th className="text-left px-4 py-3">STATUS</th>
              <th className="text-left px-4 py-3">AMOUNT</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.map((inv) => {
              const s = String(inv.status).toLowerCase();
              const amount = money(inv.totalCents);
              const isOpen = openRow === inv.id;
              const payable = (['unpaid','open'].includes(s) && Number(inv.totalCents || 0) > 0);

              return (
                <React.Fragment key={inv.id}>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-semibold">
                      <button onClick={() => setOpenRow(isOpen ? null : inv.id)} className="underline decoration-dotted">
                        {inv.id}
                      </button>
                    </td>
                    <td className="px-4 py-3">{formatPretty(inv.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[s] || 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'}`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{amount}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {payable && (
                        <button
                          onClick={() => payNow(inv.id)}
                          className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-2"
                        >
                          Pay Now
                        </button>
                      )}
                      {s === 'paid' && (
                        <button onClick={() => downloadInvoicePdf(inv.id)} className="rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm px-3 py-2">Download PDF</button>
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={5} className="px-4 py-3">
                        {(inv.items && inv.items.length) ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-slate-600">
                                  <th className="text-left py-2">Description</th>
                                  <th className="text-left py-2">Qty</th>
                                  <th className="text-left py-2">Unit</th>
                                  <th className="text-left py-2">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inv.items.map(it => (
                                  <tr key={it.id} className="border-t">
                                    <td className="py-2">{it.description}</td>
                                    <td className="py-2">{it.qty}</td>
                                    <td className="py-2">{money(it.unitAmountCents)}</td>
                                    <td className="py-2">{money(it.totalCents)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-slate-500">No items.</div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {!loading && !filtered.length && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>No invoices.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
    </section>
  );
}

// ------------------------------
// Billing Account (BillingCustomer)
// ------------------------------
function BillingAccountSection() {
  const { loading, data, error, refetch } = useBillingCustomer();
  const { items: invoices } = useInvoices();
  const { map } = useMySubs();
  const subs = Object.values(map || {});
  const unpaid = React.useMemo(
    () => invoices.some(i => ['open','unpaid'].includes(String(i.status).toLowerCase()) && Number(i.totalCents||0) > 0),
    [invoices]
  );

  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Billing Account</h2>
        {!loading && !error && (
          <button
            onClick={() => setEditOpen(true)}
            className="rounded-md bg-slate-900 text-white text-sm px-3 py-2 hover:bg-slate-700"
          >
            Edit
          </button>
        )}
      </div>

      {loading && <div className="text-slate-500">Loading billing account…</div>}
      {error && <div className="text-rose-600">Error: {String(error)}</div>}
      {!loading && (
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="text-slate-700"><b>Name:</b> {data?.billName || '—'}</div>
          <div className="text-slate-700"><b>Email:</b> {data?.billEmail || '—'}</div>
          <div className="text-slate-700"><b>Company:</b> {data?.billCompany || '—'}</div>
          <div className="text-slate-700"><b>Address:</b> {data?.billAddress || '—'}</div>
          <div className="text-slate-700"><b>Total Tools:</b> {subs.length}</div>
          <div className="text-slate-700"><b>Unpaid Invoices:</b> {unpaid ? 'Yes' : 'No'}</div>
        </div>
      )}

      <EditBillingCustomerModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={data}
        onSaved={() => refetch()}
      />
    </section>
  );
}

// ------------------------------
// Main Page
// ------------------------------
export default function Billing() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <SubscriptionsSection />
      <InvoicesSection />
      <BillingAccountSection />
    </div>
  );
}
