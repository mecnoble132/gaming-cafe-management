export type PageName = 'dashboard' | 'billing' | 'bookings' | 'settings' | 'inventory' | 'customers' | 'reports';

export const NAV_MAP: Record<string, PageName> = {
  'Dashboard': 'dashboard',
  'Billing': 'billing',
  'Bookings': 'bookings',
  'Customers': 'customers',
  'Inventory': 'inventory',
  'Reports': 'reports',
  'Settings': 'settings'
};

export const getRouteByLabel = (label: string): PageName | undefined => {
  return NAV_MAP[label];
};
