import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from './ui.jsx';

// Helper function untuk badge (boleh pindah ke fail lain nanti)
const daysLeft = (iso) => {
  if (!iso) return null;
  const d = Math.ceil((new Date(iso) - new Date()) / 86400000);
  return d > 0 ? d : 0;
};

const getBadgeForSub = (sub, isOwned) => {
  if (!isOwned) return null; // Tak perlu badge jika bukan milik kita
  if (!sub) return { text: 'Team Access', variant: 'variant-blue' }; // Akses warisan
  
  const status = (sub.status || '').toLowerCase();
  if (status === 'trialing') {
    const left = daysLeft(sub.trialEnd);
    return { text: left != null ? `Trial • ${left}d` : 'Trial', variant: 'variant-emerald' };
  }
  if (status === 'active') return { text: 'Pro', variant: 'variant-green' };
  if (status === 'past_due') return { text: 'Past Due', variant: 'variant-amber' };
  
  return { text: 'Expired', variant: 'variant-slate' };
};

// Terima 'isOwned' sebagai prop baru
export default function ToolDashboardCard({ tool, subscription, isOwned }) {
  const badge = getBadgeForSub(subscription, isOwned);

  // === LOGIK BARU UNTUK BUTANG ===
  const buttonText = isOwned ? 'Open Tool' : 'Learn More';
  const buttonLink = isOwned ? tool.basePath : `/marketplace/tool/${tool.slug}`;
  // ==============================

  return (
    <div className="bg-white rounded-lg border flex flex-col">
      <div className="p-5 flex-grow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{tool.icon}</div>
            <div>
              <h3 className="font-bold text-slate-800">{tool.name}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{tool.description}</p>
            </div>
          </div>
          {badge && <Badge className={badge.variant}>{badge.text}</Badge>}
        </div>
      </div>
      <div className="border-t p-3 bg-slate-50 rounded-b-lg">
        <Link
          to={buttonLink}
          className="w-full text-center block rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-800 border border-slate-300 hover:bg-slate-100"
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );
}