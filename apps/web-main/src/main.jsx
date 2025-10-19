import './index.css';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, AuthSuccess } from '@suite/auth';

import AppLayout from './layout/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Billing from './pages/Billing.jsx';
import Marketplace from './pages/Marketplace.jsx';
import Store from './pages/Store.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';

// Import dari pakej SalesTrack kekal sama
import { toolMeta as salestrackTool, salestrackRouteTree as salesTrackRoutes } from '@suite/salestrack';

const tools = [salestrackTool];

const router = createBrowserRouter([
  // Laluan awam kekal sama
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/auth-success', element: <AuthSuccess /> },

  // KUMPULAN 1: Laman-laman utama yang dilindungi (Dashboard, Billing, dll.)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout tools={tools} />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'billing', element: <Billing /> },
      { path: 'marketplace', element: <Marketplace /> },
      { path: 'store', element: <Store /> },
      { path: 'payment-success', element: <PaymentSuccess /> },
      {
        path: 'salestrack',
        children: salesTrackRoutes,
      },
    ]
  },
  
  { path: '*', element: <div className="p-4">Not Found</div> },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      {/* Pastikan AppLayout hang ada <Suspense> */}
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);