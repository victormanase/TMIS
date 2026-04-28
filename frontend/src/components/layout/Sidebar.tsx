import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  CreditCard,
  CalendarDays,
  BarChart3,
  UserCog,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { logout, isAdmin, isManagerOrAdmin, canViewFinancials, user } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { to: '/properties', label: 'Properties', icon: Building2, show: isManagerOrAdmin() },
    { to: '/units', label: 'Units', icon: DoorOpen, show: isManagerOrAdmin() },
    { to: '/tenants', label: 'Tenants', icon: Users, show: isManagerOrAdmin() },
    { to: '/payments', label: 'Payments', icon: CreditCard, show: canViewFinancials() },
    { to: '/bookings', label: 'AirBnB Bookings', icon: CalendarDays, show: isManagerOrAdmin() },
    { to: '/reports', label: 'Reports', icon: BarChart3, show: canViewFinancials() },
    { to: '/users', label: 'User Management', icon: UserCog, show: isAdmin() },
    { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList, show: isAdmin() },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col bg-slate-900 text-white transition-all duration-300 h-screen sticky top-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700">
        {!collapsed && (
          <div>
            <span className="font-bold text-lg text-blue-400">TMIS</span>
            <p className="text-xs text-slate-400">Rental Management</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems
          .filter((item) => item.show)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-slate-700 p-3">
        {!collapsed && (
          <div className="px-2 pb-2">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-red-600 hover:text-white transition-colors w-full',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}
