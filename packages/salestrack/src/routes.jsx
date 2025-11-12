// packages/salestrack/src/routes.jsx
import React, { lazy } from 'react';
import SalestrackShell from './SalestrackShell';
import SalestrackAccessGate from './SalestrackAccessGate';
import { SalestrackFeatureGate } from './SalestrackFeatureGate';
import { RoleProtectedRoute } from '@suite/core-context';

const SalesTrackInitializer = lazy(() => import('./pages/SalesTrackInitializer.jsx'));
const ContactsPage          = lazy(() => import('./pages/ContactsPage.jsx'));
const OpportunitiesPage     = lazy(() => import('./pages/OpportunitiesPage.jsx'));
const OpportunityDetail     = lazy(() => import('./pages/OpportunityDetail.jsx'));
const TasksPage             = lazy(() => import('./pages/TasksPage.jsx'));
const PerformanceMe         = lazy(() => import('./pages/PerformanceMe.jsx'));
const Targets               = lazy(() => import('./pages/Targets.jsx'));
const TeamPerformance       = lazy(() => import('./pages/TeamPerformance.jsx'));
const ManagerPerformance    = lazy(() => import('./pages/ManagerPerformance.jsx'));
const TeamSettingsPage      = lazy(() => import('./pages/TeamSettings.jsx'));
const TeamMembersPage       = lazy(() => import('./pages/TeamMembersPage.jsx'));
const AcceptInvite          = lazy(() => import('./pages/AcceptInvite.jsx'));
const SetupWizard           = lazy(() => import('./pages/SetupWizard.jsx'));

export const salestrackRoutes = [
  // Public invite
  { path: 'invite/:teamId/:hash/:inviterId', element: <AcceptInvite /> },
  { path: 'invite/:teamId/:hash/:pos/:inviterId', element: <AcceptInvite /> },
  { path: 'setup-my-team', element: (<SetupWizard />), },

  // Gated app
  {
    element: (
      <SalestrackAccessGate>
        <SalestrackShell />
      </SalestrackAccessGate>
    ),
    children: [
      { index: true, element: <SalesTrackInitializer /> },

      { path: 'contacts',
        element: (
          <RoleProtectedRoute allowedRoles={['SALES_REP','MANAGER','ADMIN','OWNER']}>
            <ContactsPage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'opportunities',
        element: (
          <RoleProtectedRoute allowedRoles={['SALES_REP','MANAGER','ADMIN','OWNER']}>
            <OpportunitiesPage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'opportunities/:oppId',
        element: (
          <RoleProtectedRoute allowedRoles={['SALES_REP','MANAGER','ADMIN','OWNER']}>
            <OpportunityDetail />
          </RoleProtectedRoute>
        ),
      },
      { path: 'tasks',
        element: (
          <RoleProtectedRoute allowedRoles={['SALES_REP','MANAGER','ADMIN','OWNER']}>
            <TasksPage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'targets',
        element: (
          <RoleProtectedRoute allowedRoles={['SALES_REP','MANAGER','ADMIN','OWNER']}>
            <Targets />
          </RoleProtectedRoute>
        ),
      },

      // Performance (personal: bebas)
      { path: 'performance',
        element: (
          <RoleProtectedRoute allowedRoles={['SALES_REP','MANAGER','ADMIN','OWNER']}>
            <PerformanceMe />
          </RoleProtectedRoute>
        ),
      },

      // Manager dashboards (perlu Monitoring ≥ 2)
      { path: 'manager/performance',
        element: (
          <SalestrackFeatureGate featureKey="ST_MONITORING_LEVEL" min={2}>
            <RoleProtectedRoute allowedRoles={['MANAGER']}>
              <ManagerPerformance />
            </RoleProtectedRoute>
          </SalestrackFeatureGate>
        ),
      },
      { path: 'team/performance',
        element: (
          <SalestrackFeatureGate featureKey="ST_MONITORING_LEVEL" min={2}>
            <RoleProtectedRoute allowedRoles={['ADMIN','OWNER']}>
              <TeamPerformance />
            </RoleProtectedRoute>
          </SalestrackFeatureGate>
        ),
      },

      // Team members (perlukan Team Level ≥ 2 & MemberLimit > 1)
      { path: 'team/members',
        element: (
          <SalestrackFeatureGate featureKey="ST_TEAM_LEVEL" min={2}>
            <RoleProtectedRoute allowedRoles={['MANAGER','ADMIN','OWNER']}>
              <TeamMembersPage />
            </RoleProtectedRoute>
          </SalestrackFeatureGate>
        ),
      },

      // Team settings (OWNER only; Level ≥ 1 ok — Individual boleh ubah setting team solo)
      { path: 'team/settings',
        element: (
          <SalestrackFeatureGate featureKey="ST_TEAM_LEVEL" min={1}>
            <RoleProtectedRoute allowedRoles={['OWNER']}>
              <TeamSettingsPage />
            </RoleProtectedRoute>
          </SalestrackFeatureGate>
        ),
      },
    ],
  },
];
