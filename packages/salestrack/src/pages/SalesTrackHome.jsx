import React from 'react'
import { useAuth } from '@suite/auth'
import { Card, Button } from '@suite/ui'   // optional kalau nak styled

export default function SalesTrackHome() {
  const { user, logout } = useAuth()   // user datang dari AuthProvider

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">SalesTrack</h1>

      <Card>
        <div className="text-sm text-slate-600">Signed in as</div>
        <div className="font-medium">
          {user?.name || user?.email || 'Unknown user'}
        </div>
        {user?.email && (
          <div className="text-slate-500 text-sm">{user.email}</div>
        )}

        <Button className="mt-3" onClick={logout}>Logout</Button>
      </Card>
    </div>
  )
}
