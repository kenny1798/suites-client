import React from 'react';
import { NavLink } from 'react-router-dom';
import { DotIcon, LockIcon } from './ui.jsx';
import TeamSwitcher from './TeamSwitcher.jsx';
import { useTeam } from '@suite/core-context';

export default function MobileToolsDrawer({ open, onClose, tool, canAccessFeature }) {
  const { activeTeam } = useTeam();
  const myRole = activeTeam?.TeamMembers[0]?.role;

  if (!tool) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t bg-white shadow-2xl transition-transform duration-200 md:hidden ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-200 my-3" />
        <div className="px-4 pb-4">
          <div className="mb-4">
            <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Active Team</div>
            <TeamSwitcher />
          </div>
          
          <div className="mb-2 text-sm font-semibold text-slate-700">{tool.name} Menu</div>
          <nav className="space-y-1">
            {(tool.nav ?? []).map(item => {
              if (item.allowedRoles && !item.allowedRoles.includes(myRole)) {
                return null;
              }
              const locked = item.feature ? !canAccessFeature(item.feature) : false;
              return locked ? (
                <div key={item.to} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed" title="Requires upgrade">
                  <LockIcon/><span>{item.label}</span>
                </div>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  onClick={onClose}
                  className={({isActive}) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  <DotIcon/><span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}