import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, FileText, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { reportsApi } from '@/api/reports';
import { propertiesApi } from '@/api/properties';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHead, TableBody, TableRow, Th, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

type Tab = 'rental' | 'airbnb' | 'upcoming';

const statusVariant: Record<string, 'danger' | 'warning' | 'info'> = {
  OVERDUE: 'danger',
  DUE_SOON: 'warning',
  UPCOMING: 'info',
};

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('rental');
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', propertyId: '' });
  const [applied, setApplied] = useState({ dateFrom: '', dateTo: '', propertyId: '' });

  const { data: propertiesData } = useQuery({
    queryKey: ['properties-all'],
    queryFn: () => propertiesApi.list({ limit: 100 }),
  });
  const properties = propertiesData?.data ?? [];

  const { data: rentalData, isLoading: loadingRental } = useQuery({
    queryKey: ['report-rental', applied],
    queryFn: () => reportsApi.rental(applied),
    enabled: tab === 'rental',
  });

  const { data: airbnbData, isLoading: loadingAirbnb } = useQuery({
    queryKey: ['report-airbnb', applied],
    queryFn: () => reportsApi.airbnb(applied),
    enabled: tab === 'airbnb',
  });

  const { data: upcomingData, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['report-upcoming'],
    queryFn: () => reportsApi.upcomingCollections(45),
    enabled: tab === 'upcoming',
  });

  function applyFilters() { setApplied({ ...filters }); }
  function clearFilters() { setFilters({ dateFrom: '', dateTo: '', propertyId: '' }); setApplied({ dateFrom: '', dateTo: '', propertyId: '' }); }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'rental', label: 'Rental Report' },
    { key: 'airbnb', label: 'AirBnB Report' },
    { key: 'upcoming', label: 'Upcoming Collections' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Rental income, AirBnB bookings, and collection forecasts</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters (not shown for upcoming) */}
      {tab !== 'upcoming' && (
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap gap-3 items-end">
              <select
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={filters.propertyId}
                onChange={(e) => setFilters({ ...filters, propertyId: e.target.value })}
              >
                <option value="">All Properties</option>
                {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div>
                <label className="text-xs text-slate-500 block mb-1">From</label>
                <input type="date" className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">To</label>
                <input type="date" className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
              </div>
              <Button onClick={applyFilters} size="sm">Apply</Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Rental Report ── */}
      {tab === 'rental' && (
        <div className="space-y-4">
          {rentalData && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Rent Collected', value: formatCurrency(rentalData.summary.totalRent), color: 'text-blue-700' },
                { label: 'Service Charges', value: formatCurrency(rentalData.summary.totalServiceCharge), color: 'text-violet-700' },
                { label: 'Grand Total', value: formatCurrency(rentalData.summary.grandTotal), color: 'text-emerald-700' },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="py-4">
                    <p className="text-xs text-slate-400">{s.label}</p>
                    <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => reportsApi.exportReport({ format: 'pdf', type: 'rental', ...applied })}>
              <FileText size={14} className="mr-1" /> Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => reportsApi.exportReport({ format: 'excel', type: 'rental', ...applied })}>
              <FileSpreadsheet size={14} className="mr-1" /> Export Excel
            </Button>
          </div>

          <Card>
            <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
            <CardContent className="p-0">
              {loadingRental ? <div className="p-8 text-center text-slate-400">Loading…</div> : (
                <Table>
                  <TableHead>
                    <tr><Th>Date</Th><Th>Tenant</Th><Th>Unit</Th><Th>Property</Th><Th>Type</Th><Th>Period</Th><Th>Amount</Th></tr>
                  </TableHead>
                  <TableBody>
                    {(rentalData?.payments ?? []).map((p: any) => (
                      <TableRow key={p.id}>
                        <Td>{formatDate(p.paymentDate)}</Td>
                        <Td>{p.tenant?.firstName} {p.tenant?.lastName}</Td>
                        <Td>{p.unit?.unitNumber}</Td>
                        <Td>{p.unit?.property?.name}</Td>
                        <Td><Badge variant={p.paymentType === 'RENT' ? 'info' : 'warning'}>{p.paymentType}</Badge></Td>
                        <Td className="text-xs text-slate-500">{formatDate(p.periodStart)} – {formatDate(p.periodEnd)}</Td>
                        <Td className="font-semibold">{formatCurrency(p.amount)}</Td>
                      </TableRow>
                    ))}
                    {(rentalData?.payments ?? []).length === 0 && (
                      <TableRow><Td colSpan={7} className="text-center text-slate-400 py-8">No rental payments in this period</Td></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── AirBnB Report ── */}
      {tab === 'airbnb' && (
        <div className="space-y-4">
          {airbnbData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Bookings', value: airbnbData.summary.bookingCount, isCurrency: false },
                { label: 'Total Nights', value: airbnbData.summary.totalNights, isCurrency: false },
                { label: 'Total Discount', value: formatCurrency(airbnbData.summary.totalDiscount), isCurrency: true },
                { label: 'Total Revenue', value: formatCurrency(airbnbData.summary.totalRevenue), isCurrency: true },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="py-4">
                    <p className="text-xs text-slate-400">{s.label}</p>
                    <p className="text-xl font-bold mt-1 text-slate-900">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => reportsApi.exportReport({ format: 'pdf', type: 'airbnb', ...applied })}>
              <FileText size={14} className="mr-1" /> Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => reportsApi.exportReport({ format: 'excel', type: 'airbnb', ...applied })}>
              <FileSpreadsheet size={14} className="mr-1" /> Export Excel
            </Button>
          </div>

          <Card>
            <CardHeader><CardTitle>Booking Details</CardTitle></CardHeader>
            <CardContent className="p-0">
              {loadingAirbnb ? <div className="p-8 text-center text-slate-400">Loading…</div> : (
                <Table>
                  <TableHead>
                    <tr><Th>Guest</Th><Th>Unit</Th><Th>Property</Th><Th>Check-In</Th><Th>Check-Out</Th><Th>Nights</Th><Th>Daily Rate</Th><Th>Discount</Th><Th>Total</Th></tr>
                  </TableHead>
                  <TableBody>
                    {(airbnbData?.bookings ?? []).map((b: any) => (
                      <TableRow key={b.id}>
                        <Td className="font-medium">{b.tenant?.firstName} {b.tenant?.lastName}</Td>
                        <Td>{b.unit?.unitNumber}</Td>
                        <Td>{b.unit?.property?.name}</Td>
                        <Td>{formatDate(b.startDate)}</Td>
                        <Td>{formatDate(b.endDate)}</Td>
                        <Td>{b.days}</Td>
                        <Td>{formatCurrency(b.dailyRate)}</Td>
                        <Td>{formatCurrency(b.discount)}</Td>
                        <Td className="font-semibold">{formatCurrency(b.totalAmount)}</Td>
                      </TableRow>
                    ))}
                    {(airbnbData?.bookings ?? []).length === 0 && (
                      <TableRow><Td colSpan={9} className="text-center text-slate-400 py-8">No AirBnB bookings in this period</Td></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Upcoming Collections ── */}
      {tab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingData && (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="py-4 flex items-center gap-3">
                  <AlertTriangle size={22} className="text-red-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">{upcomingData.summary.overdue}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 flex items-center gap-3">
                  <Clock size={22} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Due within 7 days</p>
                    <p className="text-2xl font-bold text-amber-600">{upcomingData.summary.dueSoon}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 flex items-center gap-3">
                  <CheckCircle size={22} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Upcoming (8–45 days)</p>
                    <p className="text-2xl font-bold text-blue-600">{upcomingData.summary.upcoming}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader><CardTitle>Tenants Due for Rent Collection (next 45 days)</CardTitle></CardHeader>
            <CardContent className="p-0">
              {loadingUpcoming ? <div className="p-8 text-center text-slate-400">Loading…</div> : (
                <Table>
                  <TableHead>
                    <tr><Th>Status</Th><Th>Tenant</Th><Th>Phone</Th><Th>Unit</Th><Th>Property</Th><Th>Period Ends</Th><Th>Days Left</Th><Th>Expected Rent</Th><Th>Last Paid</Th></tr>
                  </TableHead>
                  <TableBody>
                    {(upcomingData?.collections ?? []).map((c: any) => (
                      <TableRow key={c.assignmentId}>
                        <Td>
                          <Badge variant={statusVariant[c.status] ?? 'default'}>{c.status.replace('_', ' ')}</Badge>
                        </Td>
                        <Td className="font-medium">{c.tenant.firstName} {c.tenant.lastName}</Td>
                        <Td>{c.tenant.phone}</Td>
                        <Td>{c.unit.unitNumber}</Td>
                        <Td>{c.unit.property.name}</Td>
                        <Td>{c.lastPaidPeriodEnd ? formatDate(c.lastPaidPeriodEnd) : <span className="text-slate-400 italic">Never paid</span>}</Td>
                        <Td className={c.isOverdue ? 'text-red-600 font-bold' : c.daysRemaining <= 7 ? 'text-amber-600 font-semibold' : 'text-slate-700'}>
                          {c.isOverdue ? `${Math.abs(c.daysRemaining)}d overdue` : `${c.daysRemaining}d`}
                        </Td>
                        <Td className="font-semibold">{formatCurrency(c.expectedRent)}</Td>
                        <Td className="text-xs text-slate-500">
                          {c.lastPaymentDate ? formatDate(c.lastPaymentDate) : '—'}
                        </Td>
                      </TableRow>
                    ))}
                    {(upcomingData?.collections ?? []).length === 0 && (
                      <TableRow><Td colSpan={9} className="text-center text-slate-400 py-8">No upcoming collections in the next 45 days</Td></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
