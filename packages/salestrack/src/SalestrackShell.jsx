import React from 'react';
import { Outlet } from 'react-router-dom';
import SalestrackAccessGate from './SalestrackAccessGate';

export default function SalestrackShell() {
  return (
    <SalestrackAccessGate>
      <React.Suspense fallback={<div className="p-6 text-gray-500">Loading…</div>}>
        <Outlet />
      </React.Suspense>
    </SalestrackAccessGate>
  );
}
