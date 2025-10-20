import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronLeftIcon, ChevronRightIcon, SectionLabel, NavItem,
  SquareIcon, WrenchIcon, ChatIcon, Badge, DotIcon, LockIcon
} from './ui.jsx';

import { useAuth } from '@suite/auth';
import { useTeam } from '@suite/core-context';
import { useTools } from '../hooks/useTools';
import { useMySubs } from '../hooks/useMySubs';
import TeamSwitcher from './TeamSwitcher.jsx';

// Helper functions
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

  const myRole = activeTeam?.TeamMembers[0]?.role;
  const isLoading = loadingTools || loadingSubs;
  const HeaderTitle = activeTool ? activeTeam?.name || activeTool.name : 'Suite';

  const ownedTools = React.useMemo(() => {
    if (!user?.entitlements?.tools || !allTools) return [];
    return allTools.filter(tool => user.entitlements.tools.includes(tool.slug));
  }, [allTools, user]);

  return (
    <aside className="relative hidden lg:flex h-[calc(100dvh-3.5rem)] border-r bg-white">
      <div className="flex w-[var(--sb)] flex-col">
        <div className={`flex items-center border-b px-3 py-2 ${collapsed ? 'justify-end' : 'justify-between'}`}>
          {!collapsed && <div className="text-sm font-semibold text-slate-800 truncate" title={HeaderTitle}>{HeaderTitle}</div>}
          <button
            className="rounded-md p-1.5 hover:bg-slate-100"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        </div>

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
                  if (item.allowedRoles && !item.allowedRoles.includes(myRole)) {
                    return null;
                  }
                  const locked = item.feature ? !canAccessFeature?.(item.feature) : false;
                  return locked ? (
                    <div key={item.to} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed" title="Requires upgrade">
                      <LockIcon />
                      <span className={collapsed ? 'sr-only' : ''}>{item.label}</span>
                    </div>
                  ) : (
                    <NavLink key={item.to} to={item.to} end className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`} title={collapsed ? item.label : undefined}>
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
              <NavItem to="/" collapsed={collapsed}><SquareIcon /><span className={collapsed ? 'sr-only' : ''}>Dashboard</span></NavItem>
              <SectionLabel collapsed={collapsed} className="mt-4">Your tools</SectionLabel>
              {isLoading ? (
                <div className="p-3 text-sm text-slate-500">Loading...</div>
              ) : ownedTools.length > 0 ? (
                ownedTools.map(tool => {
                  const sub = subsMap[tool.slug];
                  const hasInheritedAccess = !!user.entitlements.tools.includes(tool.slug) && !sub;
                  const badge = getBadgeForSub(sub, hasInheritedAccess);
                  return (
                    <NavItem key={tool.slug} to={tool.basePath} collapsed={collapsed}>
                      <WrenchIcon />
                      <span className={collapsed ? 'sr-only' : ''}>{tool.name}</span>
                      {!collapsed && badge?.text && <Badge className={`ml-auto ${badge.variant}`}>{badge.text}</Badge>}
                    </NavItem>
                  );
                })
              ) : (
                <div className="mt-2 rounded-lg border px-3 py-3 text-sm text-slate-600">
                  <div className={collapsed ? 'sr-only' : ''}>
                    You don’t have any active tools.
                    <NavLink to="/marketplace" className="ml-1 font-medium text-blue-600 hover:underline">Browse →</NavLink>
                  </div>
                </div>
              )}
              <SectionLabel collapsed={collapsed} className="mt-4">Support</SectionLabel>
              <NavItem to="/support" collapsed={collapsed}><ChatIcon /><span className={collapsed ? 'sr-only' : ''}>Live Support</span></NavItem>
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}