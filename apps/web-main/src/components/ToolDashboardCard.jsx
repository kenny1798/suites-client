import React from 'react';
import { Link } from 'react-router-dom';
// Import 'Badge' dari 'ui.jsx' (yang ada dalam Canvas hang)
import { NewBadge } from './ui.jsx';

// Helper function untuk badge
const daysLeft = (iso) => {
  if (!iso) return null;
  const d = Math.ceil((new Date(iso) - new Date()) / 86400000);
  return d > 0 ? d : 0;
};

const getBadgeForSub = (sub, isOwned) => {
  if (!isOwned) return null; // Tak perlu badge jika bukan milik kita
  if (!sub) return { text: 'Team Access', variant: 'variant-blue' }; // Akses warisan
  
  const status = (sub.status || '').toLowerCase();

  // --- PERUBAHAN DI SINI (Ikut logic ui.jsx hang) ---
  if (status === 'trialing') {
    const left = daysLeft(sub.trialEnd);
    // Tukar 'emerald' ke 'blue'
    return { text: left != null ? `Trial • ${left}d` : 'Trial', variant: 'variant-blue' }; 
  }
  if (status === 'active') {
    // 'green' dah ada dalam ui.jsx
    return { text: 'Pro', variant: 'variant-green' }; 
  }
  if (status === 'past_due') {
    // 'amber' dah ada dalam ui.jsx
    return { text: 'Past Due', variant: 'variant-amber' }; 
  }
  
  // Tukar 'slate' ke 'red'
  return { text: 'Expired', variant: 'variant-red' }; 
  // --- TAMAT PERUBAHAN ---
};

// Terima 'isOwned' sebagai prop baru
export default function ToolDashboardCard({ tool, subscription, isOwned }) {
  const badge = getBadgeForSub(subscription, isOwned);

  // (Logik butang kekal sama macam kod asal hang)
  const buttonText = isOwned ? 'Open Tool' : 'Learn More';
  const buttonLink = isOwned ? tool.basePath : `/store?tool=${tool.slug}`;

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
          {/* Ini akan hantar 'variant-red', 'variant-blue' etc. 
            ke Badge component (dalam Canvas)
          */}
          {badge && <NewBadge className={badge.variant}>{badge.text}</NewBadge>}
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

