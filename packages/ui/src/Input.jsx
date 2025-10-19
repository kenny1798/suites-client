import React from 'react'

export const Input = ({ className='', ...props }) => (
  <input
    className={`w-full rounded-xl border border-gray-300 bg-white px-3 py-2 
                text-sm outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    {...props}
  />
)
