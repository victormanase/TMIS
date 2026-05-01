import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { user, logout, isAdmin, isManagerOrAdmin, canViewFinancials } = useAuth();

  const navItems = [
    { to: '/dashboard',  label: 'Dashboard',       icon: 'fa-tachometer-alt', show: true },
    { to: '/properties', label: 'Properties',       icon: 'fa-building',        show: isManagerOrAdmin() },
    { to: '/units',      label: 'Units',            icon: 'fa-door-open',       show: isManagerOrAdmin() },
    { to: '/tenants',    label: 'Tenants',          icon: 'fa-users',           show: isManagerOrAdmin() },
    { to: '/payments',   label: 'Payments',         icon: 'fa-credit-card',     show: canViewFinancials() },
    { to: '/bookings',   label: 'AirBnB Bookings',  icon: 'fa-calendar-days',   show: isManagerOrAdmin() },
    { to: '/reports',    label: 'Reports',          icon: 'fa-chart-bar',       show: canViewFinancials() },
    { to: '/users',      label: 'User Management',  icon: 'fa-user-cog',        show: isAdmin() },
    { to: '/audit-logs', label: 'Audit Logs',       icon: 'fa-clipboard-list',  show: isAdmin() },
  ];

  return (
    <aside className={`lbd-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="lbd-sidebar-logo">
        <i className="fas fa-building brand-icon" />
        {!collapsed && (
          <div>
            <div className="brand-name">TMIS</div>
            <div className="brand-sub">Rental Management</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="lbd-sidebar-nav">
        {navItems
          .filter((item) => item.show)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `lbd-nav-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <i className={`fas ${item.icon} lbd-nav-icon`} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
      </nav>

      {/* User + Logout */}
      <div className="lbd-sidebar-footer">
        {!collapsed && user && (
          <div className="mb-2 px-1">
            <p className="mb-0 fw-medium" style={{ fontSize: 13, color: '#333' }}>
              {user.firstName} {user.lastName}
            </p>
            <p className="mb-0 text-muted" style={{ fontSize: 11 }}>
              {user.role}
            </p>
          </div>
        )}
        <button
          onClick={logout}
          className="lbd-nav-link text-danger"
          style={{ width: '100%' }}
          title={collapsed ? 'Logout' : undefined}
        >
          <i className="fas fa-sign-out-alt lbd-nav-icon" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
