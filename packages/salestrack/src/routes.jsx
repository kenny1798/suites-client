// packages/salestrack/src/routes.jsx
import React, { lazy } from 'react';
import SalestrackShell from './SalestrackShell';
import { RoleProtectedRoute } from '@suite/auth';

const SalesTrackInitializer = lazy(() => import('./pages/SalesTrackInitializer.jsx'));
const ContactsPage          = lazy(() => import('./pages/ContactsPage.jsx'));
const OpportunitiesPage     = lazy(() => import('./pages/OpportunitiesPage.jsx'));
const OpportunityDetail     = lazy(() => import('./pages/OpportunityDetail.jsx'));
const TasksPage             = lazy(() => import('./pages/TasksPage.jsx'));
const PerformanceMe         = lazy(() => import('./pages/PerformanceMe.jsx'));
const Targets              = lazy(() => import('./pages/Targets.jsx'));
const TeamPerformance       = lazy(() => import('./pages/TeamPerformance.jsx'));
const ManagerPerformance   = lazy(() => import('./pages/ManagerPerformance.jsx'));
const TeamSettingsPage      = lazy(() => import('./pages/TeamSettings.jsx'));
const TeamMembersPage       = lazy(() => import('./pages/TeamMembersPage.jsx'));
const AcceptInvite          = lazy(() => import('./pages/AcceptInvite.jsx'));

/**
 * Export as array for createBrowserRouter children under path "/salestrack".
 * - Public invite routes LIVE OUTSIDE the shell (no gate/provider).
 * - Everything else sits under <SalestrackShell/>.
 */
export const salestrackRoutes = [
  // ---- Public (no shell) ----
  { path: 'invite/:teamId/:hash/:inviterId', element: <AcceptInvite /> },
  { path: 'invite/:teamId/:hash/:pos/:inviterId', element: <AcceptInvite /> },

  // ---- Gated app ----
  {
    element: <SalestrackShell />,
    children: [
      { index: true, element: <SalesTrackInitializer /> },

      {
        path: 'contacts',
        element: (
          <RoleProtectedRoute allowedRoles={['SALES_REP','MANAGER','ADMIN','OWNER']}>
            <ContactsPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'opportunities',
        element: (
          <RoleProtectedRoute allowedRoles={['SALES_REP','MANAGER','ADMIN','OWNER']}>
            <OpportunitiesPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'opportunities/:oppId',
        element: (
          <RoleProtectedRoute allowedRoles={['SALES_REP','MANAGER','ADMIN','OWNER']}>
            <OpportunityDetail />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'tasks',
        element: (
          <RoleProtectedRoute allowedRoles={['SALES_REP','MANAGER','ADMIN','OWNER']}>
            <TasksPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'targets',
        element: (
          <RoleProtectedRoute allowedRoles={['SALES_REP','MANAGER','ADMIN','OWNER']}>
            <Targets />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'performance',
        element: (
          <RoleProtectedRoute allowedRoles={['SALES_REP','MANAGER', 'ADMIN', 'OWNER']}>
            <PerformanceMe />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'manager/performance',
        element: (
          <RoleProtectedRoute allowedRoles={['MANAGER']}>
            <ManagerPerformance />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'team/performance',
        element: (
          <RoleProtectedRoute allowedRoles={['ADMIN','OWNER']}>
            <TeamPerformance />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'team/members',
        element: (
          <RoleProtectedRoute allowedRoles={['MANAGER','ADMIN','OWNER']}>
            <TeamMembersPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'team/settings',
        element: (
          <RoleProtectedRoute allowedRoles={['OWNER']}>
            <TeamSettingsPage />
          </RoleProtectedRoute>
        ),
      },
    ],
  },
];
