import React from 'react'

export const Card = ({ className='', children }) => (
  <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
    {children}
  </div>
)
