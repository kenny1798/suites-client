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
      label: 'Team Reports', 
      to: '/salestrack/reports/team',
      // Hanya Manager ke atas boleh nampak
      allowedRoles: ['MANAGER', 'ADMIN', 'OWNER'],
    },
    { 
      label: 'Team Settings', 
      to: '/salestrack/settings',
      // Hanya Admin ke atas boleh nampak
      allowedRoles: ['ADMIN', 'OWNER'],
    },
  ],
};