import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Check,
  ChevronsUpDown,
} from 'lucide-react';

/* ==== helpers ==== */
export function tabCn(active){
  return `text-sm pb-2 border-b-2 transition ${
    active ? 'border-indigo-600 text-slate-900 font-medium' : 'border-transparent text-slate-700 hover:text-indigo-600'
  }`
}
export function mItemCn(isActive){
  return `block rounded-md px-3 py-2 text-sm ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
  }`
}
export function SectionLabel({ children, collapsed, className = '' }) {
  return (
    <div className={`px-3 py-1 text-xs font-semibold uppercase text-slate-500 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'} ${className}`}>
      {children}
    </div>
  )
}
export function NavItem({ to, children, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({isActive}) =>
        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
          isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
        }`
      }
      end
      title={collapsed ? undefined : undefined}
    >
      {children}
    </NavLink>
  )
}
export function Badge({ children, className = '', ...rest }) {
  const base = 'rounded px-1.5 py-0.5 text-[10px]'
  const theme = className.includes('variant-amber')
    ? 'bg-amber-100 text-amber-700'
    : 'bg-slate-100 text-slate-700'
  return <span className={`${base} ${theme} ${className.replace('variant-amber','')}`} {...rest}>{children}</span>
}

/* ==== icons ==== */
export function MenuIcon(){
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
export function ChevronLeftIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>)
}
export function ChevronRightIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>)
}
export function DotIcon() {
  return (<svg width="6" height="6" viewBox="0 0 6 6" className="shrink-0"><circle cx="3" cy="3" r="3" fill="currentColor" /></svg>)
}
export function LockIcon(){
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M7 10V8a5 5 0 1 1 10 0v2M6 10h12v10H6V10Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
export function SquareIcon(){
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}
export function WrenchIcon(){
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M14.7 6.3a4 4 0 1 0-5.66 5.66l-6.04 6.04a2 2 0 0 0 2.83 2.83l6.04-6.04a4 4 0 0 0 5.83-5.49l-2 2a2 2 0 1 1-2.83-2.83l2-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
export function ChatIcon(){
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.5-4.5A4 4 0 0 1 2 13V7a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4v8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}


export function UserIcon(){
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}
export function KeyIcon(){
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M21 7a4 4 0 1 1-6.9 2.8L5 19H3v-2l6.1-6.1A4 4 0 0 1 21 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
export function CrownIcon(){
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 7l4 3 5-6 5 6 4-3v10H3V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
export function DoorIcon(){
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16h12V4a2 2 0 0 0-2-2Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M20 20V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="10" cy="12" r="1" fill="currentColor"/>
    </svg>
  )
}

export const CheckIcon = (props) => <Check size={16} {...props} />;

export const ChevronsUpDownIcon = (props) => <ChevronsUpDown size={16} {...props} />;
