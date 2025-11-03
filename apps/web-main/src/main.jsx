import './index.css'
import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, ProtectedRoute, AuthSuccess } from '@suite/auth'


import AppLayout from './layout/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Billing from './pages/Billing.jsx'
import Marketplace from './pages/Marketplace.jsx'
import Store from './pages/Store.jsx'
import PaymentSuccess from './pages/PaymentSuccess.jsx'
import NotFound from './pages/NotFound.jsx'
import { toolMeta as salestrackTool, salestrackRoutes as salesTrackRoutes } from '@suite/salestrack'

const tools = [salestrackTool]



function SalestrackRoutes() {
  return (
    <Routes>
      {/* children dari salesTrackRoutes (array of { path, element }) */}
      {salesTrackRoutes.map((r, i) =>
        r.children ? (
          <Route key={i} element={r.element}>
            {r.children.map((c, j) => (
              <Route key={j} path={c.path} element={c.element} index={c.index} />
            ))}
          </Route>
        ) : (
          <Route key={i} path={r.path} element={r.element} index={r.index} />
        )
      )}
    </Routes>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Suspense fallback={<div className="p-4">Loading…</div>}>

          {/* Public routes */}
          <Routes>
            <Route path="/login" element={<Login/>} />
            <Route path="/register" element={<Register/>} />
            <Route path="/auth-success" element={<AuthSuccess/>} />

            {/* Protected group */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout tools={tools} />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard/>} />
              <Route path="billing" element={<Billing/>} />
              <Route path="profile" element={<ProfilePage/>} />
              <Route path="marketplace" element={<Marketplace/>} />
              <Route path="store" element={<Store/>} />
              <Route path="payment-success" element={<PaymentSuccess/>} />

              {/* Salestrack subtree */}
              <Route path="salestrack/*" element={<SalestrackRoutes/>} />
            </Route>

            <Route path="*" element={<NotFound/>} />
          </Routes>

        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
