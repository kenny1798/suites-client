import React from 'react'
import { Link } from 'react-router-dom'

export default function PaywallModal({ open, onClose, tool, feature }) {
  if (!open || !tool) return null
  const title = feature ? 'This feature is locked' : 'This tool is locked'
  const desc  = feature
    ? `Upgrade to unlock “${feature.split('.').slice(1).join('.') || 'feature'}” in ${tool.name}.`
    : `Upgrade to access ${tool.name}.`

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose}/>
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="border-b px-5 py-4">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded bg-slate-100 text-lg">
                {tool.icon || '•'}
              </div>
              <div>
                <div className="font-medium">{tool.name}</div>
                <div className="text-xs text-slate-500">{tool.category || 'Tool'}</div>
              </div>
            </div>
            <p className="text-slate-600">{desc}</p>
            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
              <li>No credit card for trial</li>
              <li>Cancel anytime</li>
              <li>Team seats supported</li>
            </ul>
          </div>
          <div className="flex items-center justify-end gap-2 border-t bg-slate-50 px-5 py-3">
            <button onClick={onClose} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-white">Maybe later</button>
            <Link
              to={`/store?tool=${tool.id}${feature ? `&feature=${encodeURIComponent(feature)}` : ''}`}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
              onClick={onClose}
            >
              View plans
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
