import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { mItemCn, Badge } from './ui.jsx'; // Anggap Badge diimport dari ui.jsx

// 1. Import hooks yang diperlukan
import { useAuth } from '@suite/auth';
import { useTools } from '../hooks/useTools';
import { useMySubs } from '../hooks/useMySubs';

// 2. Guna semula helper function yang sama
const daysLeft = (iso) => {
  if (!iso) return null;
  const d = Math.ceil((new Date(iso) - new Date()) / 86400000);
  return d > 0 ? d : 0;
};

const getBadgeForSub = (sub, hasInheritedAccess) => {
  if (hasInheritedAccess) return { text: 'Team', variant: 'variant-blue' };
  if (!sub) return null;
  const status = (sub.status || '').toLowerCase();
  
  if (status === 'trialing') {
    const left = daysLeft(sub.trialEnd);
    return { text: left != null ? `Trial • ${left}d` : 'Trial', variant: 'variant-emerald' };
  }
  if (status === 'active') return { text: 'Pro', variant: 'variant-green' };
  if (status === 'expired' || status === 'canceled') return { text: 'Expired', variant: 'variant-slate' };
  
  return null;
};

// 3. Props 'tools' dan 'hasTool' tidak lagi diperlukan
export default function MobileNavDrawer({ open, onClose }) {
  const { user } = useAuth();
  const { data: allTools, loading: loadingTools } = useTools();
  const { map: subsMap, loading: loadingSubs } = useMySubs();

  // 4. Guna logik yang sama seperti Dashboard & DesktopSidebar
  const ownedTools = useMemo(() => {
    if (!user?.entitlements?.tools || !allTools) return [];
    return allTools.filter(tool => user.entitlements.tools.includes(tool.slug));
  }, [allTools, user]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity xl:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 border-r bg-white transition-transform duration-200 lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="border-b px-4 py-3 font-semibold">Navigation</div>
        <nav className="flex-1 p-2 overflow-y-auto">
          <NavLink to="/" onClick={onClose} className={({isActive}) => mItemCn(isActive)} end>
            Suite Dashboard
          </NavLink>
          <NavLink to="/marketplace" onClick={onClose} className={({isActive}) => mItemCn(isActive)} end>
            Marketplace
          </NavLink>

          {/* === BAHAGIAN YANG DIUBAH === */}
          <div className="px-2 pt-3 pb-1 text-xs font-semibold uppercase text-slate-500">Your Tools</div>
          {loadingTools || loadingSubs ? (
            <div className="p-2 text-sm text-slate-400">Loading...</div>
          ) : ownedTools.length > 0 ? (
            ownedTools.map(t => {
              const sub = subsMap[t.slug];
              const hasInheritedAccess = !!user.entitlements.tools.includes(t.slug) && !sub;
              const badge = getBadgeForSub(sub, hasInheritedAccess);
              return (
                <NavLink key={t.slug} to={t.basePath} onClick={onClose} className={({isActive}) => mItemCn(isActive, 'flex justify-between items-center')} end>
                  <span>{t.name}</span>
                  {badge && <Badge className={`ml-2 ${badge.variant}`}>{badge.text}</Badge>}
                </NavLink>
              );
            })
          ) : (
            <div className="p-2 text-sm text-slate-500">No tools yet.</div>
          )}
          {/* === AKHIR BAHAGIAN UBAHSUAI === */}

        </nav>

        <div className="mt-auto border-t p-3 text-xs text-slate-500">
          {user?.email}
        </div>
      </div>
    </>
  );
}