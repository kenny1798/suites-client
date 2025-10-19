import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  MenuIcon, tabCn,
  UserIcon, KeyIcon, CrownIcon, DoorIcon
} from './ui.jsx'

export default function Navbar({ user, onLogout, onHamburger, onOpenLauncher }) {
  const [open, setOpen] = React.useState(false)
  const btnRef = React.useRef(null)
  const popRef = React.useRef(null)
  const navigate = useNavigate()

  React.useEffect(() => {
    function onDown(e) {
      if (!open) return
      if (btnRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return
      setOpen(false)
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const avatarUrl = user?.avatarUrl || user?.image || user?.photoURL
  const initials = getInitials(user?.name || user?.email)

  const handleLogout = () => {
    setOpen(false)
    if (onLogout) {
      onLogout() // trigger FE logout + API call
    }
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-white">
      <div className="relative mx-auto max-w-7xl flex items-center gap-3 px-4 py-3">

        {/* HAMBURGER */}
        <button
          className="-ml-1 rounded-md p-2 hover:bg-slate-100 text-slate-900 lg:hidden"
          aria-label="Open menu"
          onClick={onHamburger}
        >
          <MenuIcon />
        </button>

        {/* LOGO */}
        <Link to="/" className="font-extrabold tracking-tight text-slate-900 uppercase">
          Suites
        </Link>

        {/* LEFT NAV (desktop) */}
        <nav className="hidden md:flex items-center gap-6 ml-6">
          <NavLink to="/" className={({ isActive }) => tabCn(isActive)}>Suites Dashboard</NavLink>
          <NavLink to="/marketplace" className={({ isActive }) => tabCn(isActive)}>Marketplace</NavLink>
          <button
            onClick={onOpenLauncher}
            className="text-sm rounded-md border px-3 py-1.5 hover:bg-slate-50 ml-auto"
            title="Open Tools (Ctrl/Cmd + K)"
          >
            Tools
          </button>
        </nav>

        {/* RIGHT SIDE */}
        <div className="ml-auto relative">
          {user ? (
            <>
              {/* Avatar button */}
              <button
                ref={btnRef}
                onClick={() => setOpen(o => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border bg-white text-slate-700 hover:bg-slate-100"
                title={user?.name || user?.email || 'Profile'}
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                  : <span className="text-xs font-semibold">{initials}</span>}
              </button>


              {/* DROPDOWN */}
              <div
                ref={popRef}
                className={`absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border bg-white shadow-lg transition
                  ${open ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'}`}
              >
                <div className="p-1">
                  <DropdownItem to="/account/profile" onClick={() => setOpen(false)}>
                    <UserIcon /><span>Edit Profile</span>
                  </DropdownItem>
                  <DropdownItem to="/account/security" onClick={() => setOpen(false)}>
                    <KeyIcon /><span>Change Password</span>
                  </DropdownItem>
                  <DropdownItem to="/account/subscriptions" onClick={() => setOpen(false)}>
                    <CrownIcon /><span>Subscriptions</span>
                  </DropdownItem>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <DoorIcon /><span>Logout</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            // No user -> Login button
            <Link
              to="/login"
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

/* ========== helpers ========== */
function getInitials(str = '') {
  const parts = str.replace(/@.*/,'').split(/\s|[\._-]/).filter(Boolean)
  const a = parts[0]?.[0] ?? 'U'
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase()
}

function DropdownItem({ to, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
    >
      {children}
    </Link>
  )
}
