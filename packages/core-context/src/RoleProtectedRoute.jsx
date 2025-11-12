import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTeam } from './TeamProvider'; // Kita perlukan 'role' dari sini

// Komponen ni akan lindungi satu route dan hanya benarkan role tertentu
export function RoleProtectedRoute({ allowedRoles, children }) {
  const { activeTeam, isLoading: isTeamLoading } = useTeam();
  const location = useLocation();

  // Dapatkan role pengguna untuk team yang aktif
  const myRole = activeTeam?.TeamMembers[0]?.role;

  // Tunjuk loading state jika data team belum sedia
  if (isTeamLoading) {
    return <div>Loading Permissions...</div>;
  }

  // Jika role pengguna ada dalam senarai yang dibenarkan, paparkan laman
  if (allowedRoles && allowedRoles.includes(myRole)) {
    return children;
  }

  // Jika tidak, halang akses. Bawa ke laman utama atau tunjuk mesej ralat.
  // 'state' di bawah akan bantu tunjuk mesej ralat jika perlu
  return <Navigate to="/unauthorized" state={{ from: location }} replace />;
}
