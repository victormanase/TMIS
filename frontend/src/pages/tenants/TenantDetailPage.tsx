import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tenantsApi } from '@/api/tenants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, Th, Td } from '@/components/ui/Table';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => tenantsApi.get(id!),
  });

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-slate-200 rounded" /><div className="h-40 bg-slate-100 rounded-xl" /></div>;
  if (!tenant) return <p>Tenant not found</p>;

  const active = tenant.assignments?.find((a: any) => a.isActive);
  const totalPaid = (tenant.payments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex align-items-center gap-3">
        <Link to="/tenants" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><i className="fas fa-arrow-left" /></Link>
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: 22, color: '#333' }}>
            {tenant.firstName} {tenant.middleName ? `${tenant.middleName} ` : ''}{tenant.lastName}
          </h1>
          <p className="text-sm text-slate-500">{tenant.phone}</p>
        </div>
        {active ? <Badge variant="success" className="ml-auto">Active Tenant</Badge> : <Badge variant="default" className="ml-auto">Unassigned</Badge>}
      </div>

      {/* Summary */}
      <div className="row g-2">
        <Card><CardContent className="py-4"><p className="text-muted small">Current Unit</p><p className="font-semibold mt-1">{active ? `${active.unit.property.name} — ${active.unit.unitNumber}` : '—'}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-muted small">Total Paid</p><p className="font-semibold mt-1">{formatCurrency(totalPaid)}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-muted small">Payments Made</p><p className="font-semibold mt-1">{tenant.payments?.length ?? 0}</p></CardContent></Card>
      </div>

      {/* Assignment History */}
      <Card>
        <CardHeader><CardTitle>Assignment History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHead><tr><Th>Property</Th><Th>Unit</Th><Th>Check-In</Th><Th>Check-Out</Th><Th>Status</Th></tr></TableHead>
            <TableBody>
              {(tenant.assignments ?? []).map((a: any) => (
                <TableRow key={a.id}>
                  <Td>{a.unit.property.name}</Td>
                  <Td>{a.unit.unitNumber}</Td>
                  <Td>{formatDate(a.checkInDate)}</Td>
                  <Td>{a.checkOutDate ? formatDate(a.checkOutDate) : '—'}</Td>
                  <Td><Badge variant={a.isActive ? 'success' : 'default'}>{a.isActive ? 'Active' : 'Ended'}</Badge></Td>
                </TableRow>
              ))}
              {(tenant.assignments ?? []).length === 0 && <TableRow><Td colSpan={5} className="text-center text-muted py-4">No assignments</Td></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Ledger */}
      <Card>
        <CardHeader><CardTitle>Payment Ledger</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHead><tr><Th>Date</Th><Th>Unit</Th><Th>Type</Th><Th>Period</Th><Th>Amount</Th><Th>Recorded By</Th></tr></TableHead>
            <TableBody>
              {(tenant.payments ?? []).map((p: any) => (
                <TableRow key={p.id}>
                  <Td>{formatDate(p.paymentDate)}</Td>
                  <Td>{p.unit?.unitNumber}</Td>
                  <Td><Badge variant="info">{p.paymentType}</Badge></Td>
                  <Td className="text-xs">{formatDate(p.periodStart)} – {formatDate(p.periodEnd)}</Td>
                  <Td className="fw-medium">{formatCurrency(p.amount)}</Td>
                  <Td className="text-muted small">{p.recordedBy?.firstName} {p.recordedBy?.lastName}</Td>
                </TableRow>
              ))}
              {(tenant.payments ?? []).length === 0 && <TableRow><Td colSpan={6} className="text-center text-muted py-4">No payments recorded</Td></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
