import { useLocation } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import { useAuth } from '@/hooks/useAuth';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/properties': 'Properties',
  '/units':      'Units',
  '/tenants':    'Tenants',
  '/payments':   'Payments',
  '/bookings':   'AirBnB Bookings',
  '/reports':    'Reports',
  '/users':      'User Management',
  '/audit-logs': 'Audit Logs',
};

interface TopNavbarProps {
  onToggleSidebar: () => void;
}

export function TopNavbar({ onToggleSidebar }: TopNavbarProps) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  // Match on prefix so nested routes (/units/abc) still get a title
  const title =
    Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] ?? 'TMIS';

  return (
    <div className="lbd-topnav">
      <button className="hamburger-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <i className="fas fa-bars" />
      </button>

      <p className="page-title">{title}</p>

      <Dropdown align="end" className="topnav-dropdown">
        <Dropdown.Toggle as="button">
          <i className="fas fa-user-circle" style={{ fontSize: 20, color: '#9a9a9a' }} />
          <span className="d-none d-md-inline ms-1" style={{ color: '#555' }}>
            {user?.firstName} {user?.lastName}
          </span>
          <i className="fas fa-caret-down ms-1" style={{ fontSize: 11, color: '#9a9a9a' }} />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Header style={{ fontSize: 12 }}>{user?.email}</Dropdown.Header>
          <Dropdown.Header style={{ fontSize: 11, color: '#aaa', paddingTop: 0 }}>{user?.role}</Dropdown.Header>
          <Dropdown.Divider />
          <Dropdown.Item onClick={logout} className="text-danger" style={{ fontSize: 13 }}>
            <i className="fas fa-sign-out-alt me-2" />
            Logout
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}
