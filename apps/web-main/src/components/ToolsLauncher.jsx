import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import { useMySubs } from '../hooks/useMySubs';

// Helper function untuk pin tools
function usePinnedTools() {
  const KEY = 'suites:pinned';
  const [pinned, setPinned] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });
  React.useEffect(() => { localStorage.setItem(KEY, JSON.stringify(pinned)); }, [pinned]);
  return { pinned, setPinned };
}

// Helper function untuk kira baki hari
const daysLeft = (iso) => {
  if (!iso) return null;
  const d = Math.ceil((new Date(iso) - new Date()) / 86400000);
  return d > 0 ? d : 0;
};

// Helper function BARU untuk dapatkan status & CTA
function getToolState(subscription) {
  if (!subscription) {
    return {
      badge: { text: 'Available' },
      cta: { text: 'Learn More', action: 'subscribe', kind: 'secondary' }
    };
  }

  const status = (subscription.status || '').toLowerCase();
  
  if (status === 'trialing') {
    const left = daysLeft(subscription.trialEnd);
    const badgeText = left != null ? `Trial • ${left}d` : 'Trial';
    return {
      badge: { text: badgeText },
      cta: { text: `Open (${left}d left)`, action: 'open', kind: 'primary' }
    };
  }
  if (status === 'active') {
    return {
      badge: { text: 'Active' },
      cta: { text: 'Open', action: 'open', kind: 'primary' }
    };
  }
  if (status === 'expired' || status === 'canceled') {
    return {
      badge: { text: 'Expired' },
      cta: { text: 'Resubscribe', action: 'subscribe', kind: 'primary' }
    };
  }
  
  // Default fallback
  return {
    badge: { text: 'Locked' },
    cta: { text: 'Subscribe', action: 'subscribe', kind: 'primary' }
  };
}

export default function ToolsLauncher({ open, onClose }) {
  const { pinned, setPinned } = usePinnedTools();
  const [q, setQ] = React.useState('');
  const navigate = useNavigate();

  // Panggil hooks untuk dapatkan data sebenar
  const { data: allTools, loading: loadingTools } = useTools();
  const { map: subsMap, loading: loadingSubs } = useMySubs();

  React.useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (open) window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);

  if (!open) return null;

  // Logik baru untuk asingkan 'your tools' dan 'more tools'
  const filtered = (allTools || [])
    .filter(t => t.name.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const pinnedTools = filtered.filter(t => pinned.includes(t.slug));
  const yourTools = filtered.filter(t => !pinned.includes(t.slug) && subsMap[t.slug]);
  const moreTools = filtered.filter(t => !pinned.includes(t.slug) && !subsMap[t.slug]);

  const pin = slug => setPinned(x => [...new Set([...x, slug])]);
  const unpin = slug => setPinned(x => x.filter(v => v !== slug));

  const handleAction = (action, tool) => {
    if (action === 'open') {
      navigate(tool.basePath);
    }
    if (action === 'subscribe') {
      navigate(`/store?tool=${tool.slug}`);
    }
    onClose?.();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 grid place-items-start pt-20">
        <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border bg-white shadow-xl">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search tools…" className="w-full rounded-md border px-3 py-2 outline-none" />
            <button onClick={onClose} className="rounded-md px-3 py-2 hover:bg-slate-100">Close</button>
          </div>
          <div className="max-h-[70dvh] overflow-auto p-3">
            {loadingTools || loadingSubs ? <div className="p-4 text-center">Loading...</div> : <>
              <Section title="Pinned" emptyText="No pinned tools">
                {pinnedTools.map(t => <ToolRow key={t.slug} tool={t} subscription={subsMap[t.slug]} pinned onUnpin={() => unpin(t.slug)} onPrimary={handleAction} />)}
              </Section>
              <Section title="Your tools" emptyText="No results">
                {yourTools.map(t => <ToolRow key={t.slug} tool={t} subscription={subsMap[t.slug]} onPin={() => pin(t.slug)} onPrimary={handleAction} />)}
              </Section>
              <Section title="More tools">
                {moreTools.map(t => <ToolRow key={t.slug} tool={t} subscription={subsMap[t.slug]} onPin={() => pin(t.slug)} onPrimary={handleAction} />)}
              </Section>
            </>}
          </div>
        </div>
      </div>
    </>
  );
}

// Komponen Section dan ToolRow yang dikemas kini
function Section({ title, emptyText, children }) {
  const has = React.Children.count(children) > 0;
  return (
    <div className="mb-4">
      <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      {has ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
           : <div className="px-2 py-2 text-sm text-slate-500">{emptyText || '—'}</div>}
    </div>
  );
}

function ToolRow({ tool, subscription, pinned, onPin, onUnpin, onPrimary }) {
  const state = getToolState(subscription);
  const { badge, cta } = state;

  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded bg-slate-100 text-sm">{tool.icon || '•'}</div>
        <div>
          <div className="flex items-center gap-2">
            <div className="font-medium">{tool.name}</div>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{badge.text}</span>
          </div>
          <div className="text-xs text-slate-500">{tool.category || 'Tool'}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPrimary(cta.action, tool)}
          className={`rounded-md px-2 py-1 text-xs ${cta.kind === 'primary' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'border hover:bg-slate-50'}`}
        >
          {cta.text}
        </button>
        {onPin && <button onClick={onPin} className="rounded-md px-2 py-1 text-xs hover:bg-slate-100" title="Pin">☆</button>}
        {onUnpin && <button onClick={onUnpin} className="rounded-md px-2 py-1 text-xs hover:bg-slate-100" title="Unpin">★</button>}
      </div>
    </div>
  );
}