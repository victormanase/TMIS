import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
        <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white">
          made with ❤️ by Smart Stack
        </footer>
      </main>
    </div>
  );
}
