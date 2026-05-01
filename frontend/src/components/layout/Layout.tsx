import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="lbd-wrapper">
      <Sidebar collapsed={collapsed} />
      <div className={`lbd-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <TopNavbar onToggleSidebar={() => setCollapsed((c) => !c)} />
        <div className="lbd-content">
          <Outlet />
        </div>
        <footer
          className="text-center text-muted border-top bg-white py-3"
          style={{ fontSize: 12 }}
        >
          made with ❤️ by Smart Stack
        </footer>
      </div>
    </div>
  );
}
