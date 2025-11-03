import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@suite/auth'
import ToolsLauncher from '../components/ToolsLauncher.jsx'
import Navbar from '../components/Navbar.jsx'
import DesktopSidebar from '../components/DesktopSidebar.jsx'
import MobileNavDrawer from '../components/MobileNavDrawer.jsx'
import MobileToolsDrawer from '../components/MobileToolsDrawer.jsx'
import MobileToolsFAB from '../components/MobileToolsFAB.jsx'
import { TeamProvider } from '@suite/core-context'

export default function AppLayout({ tools = [] }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const [navOpen, setNavOpen] = React.useState(false)     // navbar drawer (kiri)
  const [toolsOpen, setToolsOpen] = React.useState(false) // tools bottom sheet
  const [collapsed, setCollapsed] = React.useState(false) // desktop sidebar
  const [launcherOpen, setLauncherOpen] = React.useState(false)
  const ent = user?.entitlements;

  // entitlement helpers
  const hasTool = React.useCallback(
    (toolId) => !!user?.entitlements?.tools?.includes(toolId),
    [user]
  )
  const canAccessFeature = React.useCallback(
    (code) => (code ? !!user?.entitlements?.features?.[code] : true),
    [user]
  )

  // tool aktif ikut URL (untuk mobile tools drawer)
  const activeTool = React.useMemo(
    () => tools.find(t =>
      location.pathname === t.basePath ||
      location.pathname.startsWith(`${t.basePath}/`)
    ),
    [tools, location.pathname]
  )

  // auto close bila route berubah
  React.useEffect(() => {
    setNavOpen(false)
    setToolsOpen(false)
  }, [location.pathname])

  // keyboard shortcuts
  React.useEffect(() => {
    function onKey(e){
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setLauncherOpen(true)
      }
      if (e.key === 'Escape') {
        setNavOpen(false); setToolsOpen(false); setLauncherOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <TeamProvider>
    <div className="min-h-dvh bg-slate-50">
      <Navbar
        user={user}
        onLogout={logout}
        onHamburger={() => setNavOpen(true)}
        onOpenLauncher={() => setLauncherOpen(true)}
      />

      <div
        style={{ '--sb': collapsed ? '4rem' : '16rem' }}
        className="grid grid-cols-1 lg:grid-cols-[var(--sb)_1fr]"
      >
        <DesktopSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          tools={tools}
          activeTool={activeTool}
          hasTool={(id) => id === 'salestrack' && ['active','trialing','past_due'].includes((ent?.status||'').toLowerCase())}
          entitlementsByTool={{ salestrack: ent }}
          subscriptions={{}}  
          canAccessFeature={(k) => !!ent?.features?.[k]?.enabled}
        />

        <main className="min-h-[calc(100dvh-3.5rem)] p-4">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawers */}
      <MobileNavDrawer
        open={navOpen}
        onClose={() => setNavOpen(false)}
        user={user}
        tools={tools}
        hasTool={hasTool}
      />

      <MobileToolsFAB visible={!toolsOpen && !!activeTool} onClick={() => setToolsOpen(true)} />

      <MobileToolsDrawer
        open={toolsOpen}
        onClose={() => setToolsOpen(false)}
        tool={activeTool}
        canAccessFeature={canAccessFeature}
      />

      <ToolsLauncher
        open={launcherOpen}
        onClose={() => setLauncherOpen(false)}
        tools={tools}
        entitlements={user?.entitlements}
      />
    </div>
    </TeamProvider>
  )
}
