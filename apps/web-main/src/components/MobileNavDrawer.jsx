// src/components/MobileNavDrawer.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@suite/auth';
import { useTools } from '../hooks/useTools.js';
import { useMySubs } from '@suite/hooks';

export default function MobileNavDrawer({ open, onClose }) {
  const { user, suiteEntitlements } = useAuth();
  const { loading: loadingTools, data: allTools } = useTools();
  const { loading: loadingSubs } = useMySubs();

  const isLoading = loadingTools || loadingSubs;

  // 👉 sama logic dengan DesktopSidebar (guna suiteEntitlements.tools)
  const visibleTools = React.useMemo(() => {
    if (!allTools) return [];
    const suiteTools = new Set(suiteEntitlements?.tools || []);
    if (suiteTools.size === 0) return [];
    return allTools.filter((t) => suiteTools.has(t.slug));
  }, [allTools, suiteEntitlements]);

  if (!open) return null;

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 md:hidden"
        onClick={onClose}
      />
      {/* drawer */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-full bg-white shadow-xl md:hidden">
        <div className="px-4 py-4 border-b flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-800">Navigation</div>
          <button
            className="text-slate-500 text-xs"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <nav className="px-4 py-4 space-y-4 text-sm text-slate-800">
          <div className="space-y-2">
            <NavLink
              to="/"
              onClick={onClose}
              className={({ isActive }) =>
                `block rounded-md px-2 py-1 ${
                  isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`
              }
            >
              Suite Dashboard
            </NavLink>
            <NavLink
              to="/marketplace"
              onClick={onClose}
              className={({ isActive }) =>
                `block rounded-md px-2 py-1 ${
                  isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`
              }
            >
              Marketplace
            </NavLink>
          </div>

          <div className="pt-2 border-t">
            <div className="mb-2 text-xs font-semibold tracking-wide text-slate-500">
              YOUR TOOLS
            </div>

            {isLoading ? (
              <div className="text-xs text-slate-500">Loading…</div>
            ) : visibleTools.length === 0 ? (
              <div className="text-xs text-slate-500">No tools yet.</div>
            ) : (
              <div className="space-y-1">
                {visibleTools.map((tool) => (
                  <NavLink
                    key={tool.slug}
                    to={tool.basePath}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `block rounded-md px-2 py-1 ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'hover:bg-slate-100'
                      }`
                    }
                  >
                    {tool.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
