// src/components/NotificationModal.jsx
// Komponen modal reusable baru

import React from 'react';
// Guna icons untuk nampak cun
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

export default function NotificationModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'success' // 'success' atau 'error'
}) {
  if (!isOpen) return null;

  // Pilih ikon & warna berdasarkan 'type'
  const Icon = type === 'success' ? CheckCircle : AlertTriangle;
  const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';
  const buttonColor = type === 'success' 
    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500';

  return (
    // Backdrop
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Panel Modal */}
      <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 text-left shadow-xl transition-all">
        
        {/* Ikon Header */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
        </div>

        {/* Kandungan Teks */}
        <div className="mt-3 text-center sm:mt-5">
          <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
            {title}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              {message}
            </p>
          </div>
        </div>

        {/* Butang Aksi */}
        <div className="mt-5 sm:mt-6">
          <button
            type="button"
            className={`inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2`}
            onClick={onClose}
          >
            OK
          </button>
        </div>

        {/* Butang Close (X) - Optional */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
