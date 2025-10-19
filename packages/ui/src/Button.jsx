import React from 'react'

export const Button = ({ as:Comp='button', className='', ...props }) => (
  <Comp
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 
                bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800
                disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    {...props}
  />
)
