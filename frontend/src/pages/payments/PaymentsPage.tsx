import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search } from 'lucide-react';
import { paymentsApi, type Payment } from '@/api/payments';
import { tenantsApi } from '@/api/tenants';
import { unitsApi } from '@/api/units';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, Th, Td, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate, PAYMENT_TYPES } from '@/lib/utils';

const schema = z.object({
  tenantId: z.string().min(1, 'Tenant is required'),
  unitId: z.string().min(1, 'Unit is required'),
  paymentType: z.enum(['RENT', 'SERVICE_CHARGE', 'AIRBNB']),
  amount: z.coerce.number().positive('Amount must be positive'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  periodStart: z.string().min(1, 'Period start is required'),
  periodEnd: z.string().min(1, 'Period end is required'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const paymentTypeVariant: Record<string, 'info' | 'success' | 'warning'> = {
  RENT: 'info',
  SERVICE_CHARGE: 'warning',
  AIRBNB: 'success',
};

export default function PaymentsPage() {
  const { isManagerOrAdmin } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', paymentType: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, filters],
    queryFn: () => paymentsApi.list({ page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }),
  });

  const { data: tenantsData } = useQuery({ queryKey: ['tenants-all'], queryFn: () => tenantsApi.list({ limit: 200 }) });
  const { data: unitsData } = useQuery({ queryKey: ['units-all'], queryFn: () => unitsApi.list({ limit: 200 }) });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (d: FormData) => paymentsApi.create(d as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); setModalOpen(false); reset(); },
    onError: (err: any) => setFormError(err.response?.data?.message ?? 'Failed to record payment'),
  });

  const payments = data?.data ?? [];
  const pagination = data?.pagination;
  const tenants = tenantsData?.data ?? [];
  const units = unitsData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-sm text-slate-500 mt-1">Track rent and service charge collections</p>
        </div>
        {isManagerOrAdmin() && (
          <Button onClick={() => { setFormError(''); reset(); setModalOpen(true); }}>
            <Plus size={16} className="mr-1" /> Record Payment
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-slate-500 block mb-1">From</label>
              <input type="date" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">To</label>
              <input type="date" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
            </div>
            <select
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.paymentType}
              onChange={(e) => setFilters({ ...filters, paymentType: e.target.value })}
            >
              <option value="">All Types</option>
              {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <Button variant="ghost" size="sm" onClick={() => setFilters({ dateFrom: '', dateTo: '', paymentType: '' })}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}</div>
      ) : (
        <>
          <Table>
            <TableHead>
              <tr>
                <Th>Date</Th>
                <Th>Tenant</Th>
                <Th>Unit</Th>
                <Th>Property</Th>
                <Th>Type</Th>
                <Th>Period</Th>
                <Th>Amount</Th>
                <Th>Recorded By</Th>
              </tr>
            </TableHead>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><Td colSpan={8} className="text-center text-slate-400 py-8">No payments found</Td></TableRow>
              ) : (
                payments.map((p: Payment) => (
                  <TableRow key={p.id}>
                    <Td>{formatDate(p.paymentDate)}</Td>
                    <Td className="font-medium">{p.tenant?.firstName} {p.tenant?.lastName}</Td>
                    <Td>{p.unit?.unitNumber}</Td>
                    <Td>{p.unit?.property?.name}</Td>
                    <Td><Badge variant={paymentTypeVariant[p.paymentType] ?? 'default'}>{p.paymentType}</Badge></Td>
                    <Td className="text-xs text-slate-500">{formatDate(p.periodStart)} – {formatDate(p.periodEnd)}</Td>
                    <Td className="font-semibold">{formatCurrency(p.amount)}</Td>
                    <Td className="text-xs text-slate-400">{p.recordedBy?.firstName} {p.recordedBy?.lastName}</Td>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {pagination && pagination.totalPages > 1 && (
            <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      {/* Record Payment Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment" size="lg">
        {formError && <Alert variant="error" message={formError} className="mb-4" />}
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select id="tenantId" label="Tenant *" error={errors.tenantId?.message}
              options={tenants.map((t: any) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))}
              placeholder="Select tenant" {...register('tenantId')} />
            <Select id="unitId" label="Unit *" error={errors.unitId?.message}
              options={units.map((u: any) => ({ value: u.id, label: `${u.property?.name} — ${u.unitNumber}` }))}
              placeholder="Select unit" {...register('unitId')} />
            <Select id="paymentType" label="Payment Type *" error={errors.paymentType?.message}
              options={PAYMENT_TYPES.map((t) => ({ value: t, label: t }))}
              {...register('paymentType')} />
            <Input id="amount" label="Amount (TSh) *" type="number" step="0.01" error={errors.amount?.message} {...register('amount')} />
            <Input id="paymentDate" label="Payment Date *" type="date" error={errors.paymentDate?.message} {...register('paymentDate')} />
            <Input id="periodStart" label="Period Start *" type="date" error={errors.periodStart?.message} {...register('periodStart')} />
            <Input id="periodEnd" label="Period End *" type="date" error={errors.periodEnd?.message} {...register('periodEnd')} />
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 block mb-1">Notes</label>
              <textarea rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('notes')} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || createMutation.isPending}>Record Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
