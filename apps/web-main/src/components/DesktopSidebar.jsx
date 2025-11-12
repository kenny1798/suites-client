import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SectionLabel,
  NavItem,
  SquareIcon,
  WrenchIcon,
  ChatIcon,
  Badge,
  DotIcon,
  LockIcon,
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

/**
 * Badge untuk entitlements yang dah merge (direct + inherited)
 * - ent = suiteEntitlements.entitlements[toolKey]
 */
const getBadgeForEntitlement = (ent) => {
  if (!ent) return null;

  const status = (ent.status || '').toLowerCase();
  const source = ent.source || null;

  if (!status) return null;

  // 1) Inherited only → "Team"
  if (source === 'inherited' && (status === 'active' || status === 'trialing')) {
    return { text: 'Team', variant: 'variant-blue' };
  }

  // 2) Direct / Mixed → Trial / Pro
  switch (status) {
    case 'trialing': {
      const d = ent.trialEnd ? daysLeft(ent.trialEnd) : null;
      return {
        text: ent.trialEnd && d !== null ? `Trial • ${d}d` : 'Trial',
        variant: 'variant-blue',
      };
    }
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

const EXPIRED_STATUSES = new Set([
  'expired',
  'canceled',
  'past_due',
  'unpaid',
  'barred',
]);

export default function DesktopSidebar({
  collapsed,
  setCollapsed,
  activeTool,
  canAccessFeature,
}) {
  const { suiteEntitlements } = useAuth();
  const { activeTeam } = useTeam();
  const { loading: loadingTools, data: allTools } = useTools();
  const { loading: loadingSubs } = useMySubs(); // guna untuk loading overall

  const isLoading = loadingTools || loadingSubs;
  const HeaderTitle = activeTool ? (activeTeam?.name || activeTool.name) : 'Suite';

  // 👉 role user dalam team
  const myRole = activeTeam?.TeamMembers?.[0]?.role;

  // === Tools yang MASIH boleh guna (active/trialing) ===
  const visibleTools = React.useMemo(() => {
    if (!allTools) return [];
    const suiteTools = new Set(suiteEntitlements?.tools || []);
    if (suiteTools.size === 0) return [];
    return allTools.filter((t) => suiteTools.has(t.slug));
  }, [allTools, suiteEntitlements]);

  // === Previously used tools (tak active/trialing lagi) ===
  const previouslyUsedTools = React.useMemo(() => {
    if (!allTools) return [];
    const meta = suiteEntitlements?.meta || {};
    const activeKeys = new Set(suiteEntitlements?.tools || []);

    const result = [];

    for (const [toolKey, history] of Object.entries(meta)) {
      // toolKey di meta kemungkinan id; cuba match dengan id dulu, kalau tak jumpa baru cuba slug
      const tool = allTools.find(
        (t) =>
          String(t.id) === String(toolKey) ||
          t.slug === toolKey
      );
      if (!tool) continue;

      // skip kalau masih aktif/trialing (dah ada di "Your tools")
      if (activeKeys.has(tool.slug) || activeKeys.has(String(tool.id))) {
        continue;
      }

      const direct = history.direct || [];
      const inherited = history.inherited || [];
      const allHist = [...direct, ...inherited];

      if (allHist.length === 0) continue;

      // check kalau pernah ada status expired / canceled / past_due / unpaid / barred
      const hasExpiredLike = allHist.some((s) =>
        EXPIRED_STATUSES.has((s.status || '').toLowerCase())
      );
      if (!hasExpiredLike) continue;

      result.push(tool);
    }

    // optional: sort by name supaya stabil
    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [allTools, suiteEntitlements]);

  return (
    <aside className="relative hidden lg:flex h-[calc(100dvh-3.5rem)] border-r bg-white">
      <div className="flex w-[var(--sb)] flex-col">
        {/* Header */}
        <div
          className={`flex items-center border-b px-3 py-2 ${
            collapsed ? 'justify-end' : 'justify-between'
          }`}
        >
          {!collapsed && (
            <div
              className="text-sm font-semibold text-slate-800 truncate"
              title={HeaderTitle}
            >
              {HeaderTitle}
            </div>
          )}
          <button
            className="rounded-md p-1.5 hover:bg-slate-100"
            onClick={() => setCollapsed((c) => !c)}
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
                {(activeTool.nav || []).map((item) => {
                  if (item.allowedRoles && !item.allowedRoles.includes(myRole)) {
                    return null;
                  }

                  const locked = item.feature
                    ? !canAccessFeature?.(item.feature)
                    : false;

                  return locked ? (
                    <div
                      key={item.to}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                      title="Requires upgrade"
                    >
                      <LockIcon />
                      <span className={collapsed ? 'sr-only' : ''}>
                        {item.label}
                      </span>
                    </div>
                  ) : (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                          isActive
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <DotIcon />
                      <span className={collapsed ? 'sr-only' : ''}>
                        {item.label}
                      </span>
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

              {/* ---- Your tools (active / trialing) ---- */}
              <SectionLabel collapsed={collapsed} className="mt-4">
                Your tools
              </SectionLabel>

              {isLoading ? (
                <div className="p-3 text-sm text-slate-500">Loading...</div>
              ) : visibleTools.length > 0 ? (
                visibleTools.map((tool) => {
                  const ent =
                    suiteEntitlements?.entitlements?.[tool.slug] ||
                    suiteEntitlements?.entitlements?.[String(tool.id)] ||
                    null;
                  const badge = getBadgeForEntitlement(ent);

                  return (
                    <NavItem
                      key={tool.slug}
                      to={tool.basePath}
                      collapsed={collapsed}
                    >
                      <WrenchIcon />
                      <span className={collapsed ? 'sr-only' : ''}>
                        {tool.name}
                      </span>
                      {!collapsed && badge?.text && (
                        <Badge className={`ml-auto ${badge.variant}`}>
                          {badge.text}
                        </Badge>
                      )}
                    </NavItem>
                  );
                })
              ) : (
                <div className="mt-2 rounded-lg border px-3 py-3 text-sm text-slate-600">
                  <div className={collapsed ? 'sr-only' : ''}>
                    You don’t have any active tools.
                    <NavLink
                      to="/marketplace"
                      className="ml-1 font-medium text-blue-600 hover:underline"
                    >
                      Browse →
                    </NavLink>
                  </div>
                </div>
              )}

              {/* ---- Previously used tools (expired) ---- */}
              {previouslyUsedTools.length > 0 && (
                <>
                  <SectionLabel collapsed={collapsed} className="mt-4">
                    Previously used
                  </SectionLabel>
                  {previouslyUsedTools.map((tool) => (
                    <NavItem
                      key={`prev-${tool.slug}`}
                      to={tool.basePath}
                      collapsed={collapsed}
                    >
                      <WrenchIcon />
                      <span className={collapsed ? 'sr-only' : ''}>
                        {tool.name}
                      </span>
                      {!collapsed && (
                        <Badge className="ml-auto variant-slate">
                          Expired
                        </Badge>
                      )}
                    </NavItem>
                  ))}
                </>
              )}

              {/* ---- Support ---- */}
              <SectionLabel collapsed={collapsed} className="mt-4">
                Support
              </SectionLabel>
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
