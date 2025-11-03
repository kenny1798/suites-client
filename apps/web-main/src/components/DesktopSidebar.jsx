import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronLeftIcon, ChevronRightIcon, SectionLabel, NavItem,
  SquareIcon, WrenchIcon, ChatIcon, Badge, DotIcon, LockIcon
} from './ui.jsx';

import { useAuth } from '@suite/auth';
import { useTeam } from '@suite/core-context';
import { useTools } from '../hooks/useTools.js';
import { useMySubs } from '@suite/hooks';
import TeamSwitcher from './TeamSwitcher.jsx';

/* ---------- Helpers ---------- */
const daysLeft = (iso) => {
  if (!iso) return null;
  const diff = Math.ceil((new Date(iso) - new Date()) / 86400000);
  return diff > 0 ? diff : 0;
};

const getBadgeForSub = (sub, hasInheritedAccess) => {
  if (hasInheritedAccess) return { text: 'Team', variant: 'variant-blue' };
  if (!sub) return null;

  const status = (sub.status || '').toLowerCase();

  switch (status) {
    case 'trialing':
      return {
        text: sub.trialEnd ? `Trial • ${daysLeft(sub.trialEnd)}d` : 'Trial',
        variant: 'variant-blue'
      };
    case 'active':
      return { text: 'Pro', variant: 'variant-green' };
    case 'past_due':
    case 'unpaid':
      return { text: 'Past Due', variant: 'variant-amber' };
    case 'barred':
      return { text: 'Barred', variant: 'variant-red' };
    case 'expired':
      return { text: 'Expired', variant: 'variant-slate' };
    case 'canceled':
      return { text: 'Canceled', variant: 'variant-slate' };
    default:
      return { text: status, variant: 'variant-slate' };
  }
};

export default function DesktopSidebar({
  collapsed,
  setCollapsed,
  activeTool,
  canAccessFeature,
}) {
  const { user } = useAuth();
  const { activeTeam } = useTeam();
  const { loading: loadingTools, data: allTools } = useTools();
  const { loading: loadingSubs, map: subsMap } = useMySubs();

  const isLoading = loadingTools || loadingSubs;
  const HeaderTitle = activeTool ? (activeTeam?.name || activeTool.name) : 'Suite';

  // === Combine entitlements + subscriptions ===
  const visibleTools = React.useMemo(() => {
    if (!allTools) return [];
    const ent = new Set(user?.entitlements?.tools || []);
    const subSlugs = new Set(Object.keys(subsMap || {}));
    const union = new Set([...ent, ...subSlugs]);
    return allTools.filter(t => union.has(t.slug));
  }, [allTools, user, subsMap]);

  return (
    <aside className="relative hidden lg:flex h-[calc(100dvh-3.5rem)] border-r bg-white">
      <div className="flex w-[var(--sb)] flex-col">
        {/* Header */}
        <div className={`flex items-center border-b px-3 py-2 ${collapsed ? 'justify-end' : 'justify-between'}`}>
          {!collapsed && (
            <div className="text-sm font-semibold text-slate-800 truncate" title={HeaderTitle}>
              {HeaderTitle}
            </div>
          )}
          <button
            className="rounded-md p-1.5 hover:bg-slate-100"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        </div>

        {/* Body */}
        <nav className="flex-1 p-3 text-slate-700 overflow-y-auto">
          {activeTool ? (
            <>
              {!collapsed && (
                <div className="mb-4">
                  <SectionLabel collapsed={collapsed}>Active Team</SectionLabel>
                  <TeamSwitcher />
                </div>
              )}
              <div className="space-y-1">
                {(activeTool.nav || []).map(item => {
                  const locked = item.feature ? !canAccessFeature?.(item.feature) : false;
                  return locked ? (
                    <div
                      key={item.to}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                      title="Requires upgrade"
                    >
                      <LockIcon />
                      <span className={collapsed ? 'sr-only' : ''}>{item.label}</span>
                    </div>
                  ) : (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                          isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <DotIcon />
                      <span className={collapsed ? 'sr-only' : ''}>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <SectionLabel collapsed={collapsed}>Dashboard</SectionLabel>
              <NavItem to="/" collapsed={collapsed}>
                <SquareIcon />
                <span className={collapsed ? 'sr-only' : ''}>Dashboard</span>
              </NavItem>

              <SectionLabel collapsed={collapsed} className="mt-4">Your tools</SectionLabel>

              {isLoading ? (
                <div className="p-3 text-sm text-slate-500">Loading...</div>
              ) : visibleTools.length > 0 ? (
                visibleTools.map(tool => {
                  const sub = subsMap[tool.slug];
                  const hasInheritedAccess =
                    (user?.entitlements?.tools || []).includes(tool.slug) && !sub;
                  const badge = getBadgeForSub(sub, hasInheritedAccess);

                  return (
                    <NavItem key={tool.slug} to={tool.basePath} collapsed={collapsed}>
                      <WrenchIcon />
                      <span className={collapsed ? 'sr-only' : ''}>{tool.name}</span>
                      {!collapsed && badge?.text && (
                        <Badge className={`ml-auto ${badge.variant}`}>{badge.text}</Badge>
                      )}
                    </NavItem>
                  );
                })
              ) : (
                <div className="mt-2 rounded-lg border px-3 py-3 text-sm text-slate-600">
                  <div className={collapsed ? 'sr-only' : ''}>
                    You don’t have any active tools.
                    <NavLink to="/marketplace" className="ml-1 font-medium text-blue-600 hover:underline">
                      Browse →
                    </NavLink>
                  </div>
                </div>
              )}

              <SectionLabel collapsed={collapsed} className="mt-4">Support</SectionLabel>
              <NavItem to="/support" collapsed={collapsed}>
                <ChatIcon />
                <span className={collapsed ? 'sr-only' : ''}>Live Support</span>
              </NavItem>
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}
