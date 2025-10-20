export const toolMeta = {
  // Maklumat Asas Tool
  slug: 'salestrack', // Guna 'slug' dan bukan 'id' untuk konsisten
  name: 'SalesTrack',
  basePath: '/salestrack',
  category: 'Sales',
  icon: '🧭',
  description: 'A lightweight CRM to manage your sales pipeline.',
  
  // Senarai Navigasi & Kebenaran Akses
  nav: [
    { 
      label: 'Dashboard', 
      to: '/salestrack',
      // Semua role boleh nampak dashboard tool
      allowedRoles: ['SALES_REP', 'MANAGER', 'ADMIN', 'OWNER'],
    },
    { 
      label: 'Contacts', 
      to: '/salestrack/contacts',
      allowedRoles: ['SALES_REP', 'MANAGER', 'ADMIN', 'OWNER'],
    },
    { 
      label: 'Opportunities', 
      to: '/salestrack/opportunities',
      allowedRoles: ['SALES_REP', 'MANAGER', 'ADMIN', 'OWNER'],
    },
    { 
      label: 'Tasks', 
      to: '/salestrack/tasks',
      allowedRoles: ['SALES_REP', 'MANAGER', 'ADMIN', 'OWNER'],
    },
    { 
      label: 'Targets', 
      to: '/salestrack/targets',
      allowedRoles: ['SALES_REP', 'MANAGER', 'ADMIN','OWNER'],
    },
    { 
      label: 'My Performance', 
      to: '/salestrack/performance',
      allowedRoles: ['SALES_REP', 'MANAGER', 'ADMIN', 'OWNER'],
    },
    { 
      label: 'Team Performance', 
      to: '/salestrack/manager/performance',
      allowedRoles: ['MANAGER'],
    },
    { 
      label: 'Team Performance', 
      to: '/salestrack/team/performance',
      allowedRoles: ['ADMIN', 'OWNER'],
    },
    { 
      label: 'Team Members', 
      to: '/salestrack/team/members',
      allowedRoles: ['MANAGER', 'ADMIN', 'OWNER'],
    },
    { 
      label: 'Team Settings', 
      to: '/salestrack/team/settings',
      allowedRoles: ['OWNER'],
    },
  ],
};