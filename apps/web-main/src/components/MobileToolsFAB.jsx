import React from 'react'

export default function MobileToolsFAB({ visible, onClick }) {
  if (!visible) return null
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 z-40 rounded-full bg-indigo-600 p-4 text-white shadow-lg md:hidden"
      aria-label="Open tools"
      title="Tools"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 18l6-8 6 8 3-4 3 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}
