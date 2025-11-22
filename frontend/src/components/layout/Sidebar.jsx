import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  History,
  Settings,
  Receipt,
  Truck,
  BarChart3,
  Users,
  MapPin
} from 'lucide-react';

const sidebarItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    current: true
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Package,
    current: false,
    children: [
      { name: 'Stock Overview', href: '/stock', icon: Package },
      { name: 'Warehouses', href: '/warehouses', icon: Warehouse },
      { name: 'Locations', href: '/locations', icon: MapPin }
    ]
  },
  {
    name: 'Operations',
    href: '/operations',
    icon: Receipt,
    current: false,
    children: [
      { name: 'Receipts', href: '/operations/receipt', icon: Receipt },
      { name: 'Deliveries', href: '/operations/delivery', icon: Truck },
      { name: 'Adjustments', href: '/operations/adjustment', icon: BarChart3 }
    ]
  },
  {
    name: 'Move History',
    href: '/move-history',
    icon: History,
    current: false
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    current: false
  }
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const isCurrentPath = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const SidebarItem = ({ item, isChild = false }) => {
    const isActive = isCurrentPath(item.href);
    
    return (
      <Link
        to={item.href}
        onClick={onClose}
        className={cn(
          'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          isChild ? 'ml-6 pl-6' : '',
          isActive
            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
      >
        <item.icon 
          className={cn(
            'mr-3 h-5 w-5',
            isActive ? 'text-blue-700' : 'text-gray-400'
          )} 
        />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'w-64 bg-white border-r border-gray-200 flex-shrink-0 lg:block',
        isOpen ? 'fixed inset-y-0 left-0 z-30 lg:relative' : 'hidden lg:block'
      )}>
        {/* Sidebar content */}
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">I</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Inventora
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => (
              <div key={item.name}>
                <SidebarItem item={item} />
                {item.children && (
                  <div className="mt-1 space-y-1">
                    {item.children.map((child) => (
                      <SidebarItem key={child.name} item={child} isChild />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Inventora v1.0.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;