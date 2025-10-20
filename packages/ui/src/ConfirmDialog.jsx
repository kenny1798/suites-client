import React, { useEffect } from 'react';

export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onCancel?.(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />
      {/* modal */}
      <div className="relative w-[92%] max-w-md rounded-xl bg-white shadow-xl">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <div className="px-4 py-4 text-sm text-gray-700 whitespace-pre-wrap">
          {message}
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-gray-900 text-white px-3 py-1.5 text-sm hover:bg-black"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}