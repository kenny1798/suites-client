// packages/salestrack/src/routes.jsx (Versi Dikemas kini)

import React, { lazy } from 'react';
import { RoleProtectedRoute } from '@suite/auth';
import { TeamProvider } from '@suite/core-context';

const ContactsPage = lazy(() => import('./pages/ContactsPage.jsx'));
const TeamReportsPage = lazy(() => import('./pages/TeamReportsPage.jsx')); // Contoh laman baru
const TeamSettingsPage = lazy(() => import('./pages/TeamSettings.jsx')); // Contoh laman baru
const SalesTrackInitializer = lazy(() => import('./pages/SalesTrackInitializer.jsx'));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite.jsx'));
const TeamMembersPage = lazy(() => import('./pages/TeamMembersPage.jsx'));

export const routes = [
  { 
    index: true,
    element: (
        <SalesTrackInitializer />
    )
  },
  { 
    path: 'contacts',
    element: (
      // Semua orang boleh lihat laman Contacts
      <RoleProtectedRoute allowedRoles={['SALES_REP', 'MANAGER', 'ADMIN', 'OWNER']}>
        <ContactsPage />
      </RoleProtectedRoute>
    )
  },
  {
    path: 'reports/team',
    element: (
      // Hanya Manager ke atas boleh lihat laporan pasukan
      <RoleProtectedRoute allowedRoles={['MANAGER', 'ADMIN', 'OWNER']}>
        <TeamReportsPage />
      </RoleProtectedRoute>
    )
  },
  {
    path: 'members',
    element: (
      // Hanya Manager ke atas boleh lihat laporan pasukan
      <RoleProtectedRoute allowedRoles={['MANAGER', 'ADMIN', 'OWNER']}>
        <TeamMembersPage />
      </RoleProtectedRoute>
    )
  },
  {
    path: 'settings',
    element: (
      // Hanya Admin ke atas boleh akses tetapan
      <RoleProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
        <TeamSettingsPage />
      </RoleProtectedRoute>
    )
  },
  {
    path: 'invite/:teamId/:hash/:inviterId',
    element: (
      <AcceptInvite />
    )
  },
  {
    path: 'invite/:teamId/:hash/:pos/:inviterId',
    element: (
      <AcceptInvite />
    )
  }
];