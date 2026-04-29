import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import {
  Building2,
  DoorOpen,
  Users,
  Wallet,
  AlertTriangle,
  Clock,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { reportsApi } from '@/api/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

const PIE_COLORS = ['#2563eb', '#cbd5e1'];

function KpiCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.dashboard,
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const occupancyData = [
    { name: 'Occupied', value: stats?.occupiedUnits ?? 0 },
    { name: 'Vacant', value: stats?.vacantUnits ?? 0 },
  ];

  const upcoming = stats?.upcomingCollections;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">System overview and key metrics</p>
      </div>

      {/* ── Upcoming Collections Notification Banner ── */}
      {upcoming && upcoming.total > 0 && (
        <Link to="/reports" state={{ tab: 'upcoming' }}>
          <div
            className={`flex items-center justify-between gap-4 px-5 py-4 rounded-xl border-l-4 transition-opacity hover:opacity-90 cursor-pointer ${
              upcoming.overdue > 0
                ? 'bg-red-50 border-red-500'
                : 'bg-amber-50 border-amber-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell
                size={22}
                className={upcoming.overdue > 0 ? 'text-red-500' : 'text-amber-500'}
              />
              <div>
                <p className={`font-semibold text-sm ${upcoming.overdue > 0 ? 'text-red-700' : 'text-amber-700'}`}>
                  Upcoming Rent Collections — {upcoming.total} tenant{upcoming.total !== 1 ? 's' : ''} due in the next 45 days
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {upcoming.overdue > 0 && (
                    <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                      <AlertTriangle size={12} /> {upcoming.overdue} overdue
                    </span>
                  )}
                  {upcoming.dueSoon > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                      <Clock size={12} /> {upcoming.dueSoon} due within 7 days
                    </span>
                  )}
                  {upcoming.upcoming > 0 && (
                    <span className="text-xs text-slate-500">{upcoming.upcoming} upcoming</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-500 shrink-0">
              View report <ArrowRight size={14} />
            </div>
          </div>
        </Link>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          icon={Wallet}
          color="bg-blue-600"
          subtitle="All time"
        />
        <KpiCard
          title="Occupied Units"
          value={`${stats?.occupiedUnits ?? 0} / ${stats?.totalUnits ?? 0}`}
          icon={DoorOpen}
          color="bg-emerald-600"
          subtitle={`${stats?.occupancyRate ?? 0}% occupancy rate`}
        />
        <KpiCard
          title="Total Tenants"
          value={stats?.totalTenants ?? 0}
          icon={Users}
          color="bg-violet-600"
        />
        <KpiCard
          title="Properties"
          value={stats?.totalProperties ?? 0}
          icon={Building2}
          color="bg-amber-500"
          subtitle={`${stats?.totalUnits ?? 0} units total`}
        />
      </div>

      {/* ── Upcoming Collections Mini-Cards ── */}
      {upcoming && upcoming.total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-red-100">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Overdue</p>
                <p className="text-xl font-bold text-red-600">{upcoming.overdue}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-100">
            <CardContent className="py-4 flex items-center gap-3">
              <Clock size={20} className="text-amber-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Due in 7 days</p>
                <p className="text-xl font-bold text-amber-600">{upcoming.dueSoon}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-100">
            <CardContent className="py-4 flex items-center gap-3">
              <Bell size={20} className="text-blue-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Next 45 days</p>
                <p className="text-xl font-bold text-blue-600">{upcoming.upcoming}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Income (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={stats?.monthlyIncome ?? []}
                margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="rent" name="Rent" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="serviceCharge" name="Service Charge" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="airbnb" name="AirBnB" fill="#0891b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Occupancy Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
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
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                Occupied ({stats?.occupiedUnits ?? 0})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
                Vacant ({stats?.vacantUnits ?? 0})
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-3">{stats?.occupancyRate ?? 0}%</p>
            <p className="text-xs text-slate-400">Occupancy Rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
