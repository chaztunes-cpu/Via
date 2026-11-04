import { LayoutDashboard, FolderOpen, Users, CircleCheckBig, Settings } from 'lucide-react';

// Add future sections (Pipeline, Invoices, …) here.
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'All Projects', icon: FolderOpen },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/completed', label: 'Completed Projects', icon: CircleCheckBig },
];

export const SECONDARY_NAV_ITEMS = [{ to: '/settings', label: 'Settings', icon: Settings }];
