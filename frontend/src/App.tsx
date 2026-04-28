import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import LoginPage from '@/pages/auth/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import PropertiesPage from '@/pages/properties/PropertiesPage';
import UnitsPage from '@/pages/units/UnitsPage';
import UnitDetailPage from '@/pages/units/UnitDetailPage';
import TenantsPage from '@/pages/tenants/TenantsPage';
import TenantDetailPage from '@/pages/tenants/TenantDetailPage';
import PaymentsPage from '@/pages/payments/PaymentsPage';
import BookingsPage from '@/pages/bookings/BookingsPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import UsersPage from '@/pages/users/UsersPage';
import AuditLogsPage from '@/pages/audit-logs/AuditLogsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/properties" element={<PropertiesPage />} />
              <Route path="/units" element={<UnitsPage />} />
              <Route path="/units/:id" element={<UnitDetailPage />} />
              <Route path="/tenants" element={<TenantsPage />} />
              <Route path="/tenants/:id" element={<TenantDetailPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/reports" element={<ReportsPage />} />

              {/* Admin only */}
              <Route element={<ProtectedRoute requiredRoles={['ADMIN']} />}>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
