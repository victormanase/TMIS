import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { reportsApi } from '@/api/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

const PIE_COLORS = ['#51cbce', '#e0e0e0'];

interface KpiCardProps {
  title: string;
  value: string | number;
  faIcon: string;
  color: string;
  subtitle?: string;
}

function KpiCard({ title, value, faIcon, color, subtitle }: KpiCardProps) {
  return (
    <div className="card lbd-stat-card">
      <div className="card-body">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-number">{value}</p>
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </div>
        <div className="stat-icon" style={{ background: color }}>
          <i className={`fas ${faIcon}`} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.dashboard,
    refetchInterval: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div>
        <div className="mb-3" style={{ height: 28, width: 180, background: '#e9e9e9', borderRadius: 4 }} />
        <div className="row g-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="col-12 col-sm-6 col-xl-3">
              <div className="card" style={{ height: 100, background: '#f0f0f0' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const upcoming = stats?.upcomingCollections;
  const occupancyData = [
    { name: 'Occupied', value: stats?.occupiedUnits ?? 0 },
    { name: 'Vacant',   value: stats?.vacantUnits ?? 0 },
  ];

  return (
    <div>
      <div className="mb-3">
        <h4 className="fw-bold mb-1" style={{ color: '#333' }}>Dashboard</h4>
        <p className="text-muted small mb-0">System overview and key metrics</p>
      </div>

      {/* ── Upcoming Collections Alert Banner ── */}
      {upcoming && upcoming.total > 0 && (
        <Link
          to="/reports"
          className={`lbd-alert-banner mb-4 d-block ${upcoming.overdue > 0 ? 'danger' : 'warning'}`}
          style={{ textDecoration: 'none' }}
        >
          <i
            className={`fas fa-bell fa-lg ${upcoming.overdue > 0 ? 'text-danger' : 'text-warning'}`}
          />
          <div className="flex-grow-1">
            <p
              className={`mb-1 fw-semibold small ${upcoming.overdue > 0 ? 'text-danger' : 'text-warning'}`}
            >
              Upcoming Rent Collections — {upcoming.total} tenant{upcoming.total !== 1 ? 's' : ''} due in the next 45 days
            </p>
            <div className="d-flex gap-3">
              {upcoming.overdue > 0 && (
                <span className="text-danger small fw-medium">
                  <i className="fas fa-exclamation-triangle me-1" />
                  {upcoming.overdue} overdue
                </span>
              )}
              {upcoming.dueSoon > 0 && (
                <span className="text-warning small fw-medium">
                  <i className="fas fa-clock me-1" />
                  {upcoming.dueSoon} due within 7 days
                </span>
              )}
              {upcoming.upcoming > 0 && (
                <span className="text-muted small">{upcoming.upcoming} upcoming</span>
              )}
            </div>
          </div>
          <i className="fas fa-arrow-right text-muted" />
        </Link>
      )}

      {/* ── KPI Cards ── */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue ?? 0)}
            faIcon="fa-wallet"
            color="var(--lbd-primary)"
            subtitle="All time"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            title="Occupied Units"
            value={`${stats?.occupiedUnits ?? 0} / ${stats?.totalUnits ?? 0}`}
            faIcon="fa-door-open"
            color="var(--lbd-success)"
            subtitle={`${stats?.occupancyRate ?? 0}% occupancy rate`}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            title="Total Tenants"
            value={stats?.totalTenants ?? 0}
            faIcon="fa-users"
            color="var(--lbd-info)"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <KpiCard
            title="Properties"
            value={stats?.totalProperties ?? 0}
            faIcon="fa-building"
            color="var(--lbd-warning)"
            subtitle={`${stats?.totalUnits ?? 0} units total`}
          />
        </div>
      </div>

      {/* ── Upcoming Mini-Cards ── */}
      {upcoming && upcoming.total > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card">
              <div className="card-body d-flex align-items-center gap-3 py-3">
                <i className="fas fa-exclamation-triangle fa-lg" style={{ color: 'var(--lbd-danger)' }} />
                <div>
                  <p className="mb-0 small text-muted">Overdue</p>
                  <p className="mb-0 fw-bold fs-5" style={{ color: 'var(--lbd-danger)' }}>{upcoming.overdue}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card">
              <div className="card-body d-flex align-items-center gap-3 py-3">
                <i className="fas fa-clock fa-lg" style={{ color: 'var(--lbd-warning)' }} />
                <div>
                  <p className="mb-0 small text-muted">Due in 7 days</p>
                  <p className="mb-0 fw-bold fs-5" style={{ color: 'var(--lbd-warning)' }}>{upcoming.dueSoon}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card">
              <div className="card-body d-flex align-items-center gap-3 py-3">
                <i className="fas fa-bell fa-lg" style={{ color: 'var(--lbd-info)' }} />
                <div>
                  <p className="mb-0 small text-muted">Next 45 days</p>
                  <p className="mb-0 fw-bold fs-5" style={{ color: 'var(--lbd-info)' }}>{upcoming.upcoming}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Charts ── */}
      <div className="row g-2">
        <div className="col-12 col-xl-8">
          <Card>
            <CardHeader><CardTitle>Monthly Income (Last 6 Months)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats?.monthlyIncome ?? []} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="rent"          name="Rent"           fill="#51cbce" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="serviceCharge" name="Service Charge" fill="#ffa534" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="airbnb"        name="AirBnB"         fill="#87cb16" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="col-12 col-xl-4">
          <Card className="h-100">
            <CardHeader><CardTitle>Occupancy Status</CardTitle></CardHeader>
            <CardContent className="d-flex flex-column align-items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {occupancyData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="d-flex gap-4 mt-2 small">
                <span className="d-flex align-items-center gap-1">
                  <span className="rounded-circle d-inline-block" style={{ width: 10, height: 10, background: '#51cbce' }} />
                  Occupied ({stats?.occupiedUnits ?? 0})
                </span>
                <span className="d-flex align-items-center gap-1">
                  <span className="rounded-circle d-inline-block" style={{ width: 10, height: 10, background: '#e0e0e0' }} />
                  Vacant ({stats?.vacantUnits ?? 0})
                </span>
              </div>

              <p className="fw-bold mt-3 mb-0" style={{ fontSize: 28, color: '#333' }}>
                {stats?.occupancyRate ?? 0}%
              </p>
              <p className="text-muted small">Occupancy Rate</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
