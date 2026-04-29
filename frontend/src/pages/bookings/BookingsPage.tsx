import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { bookingsApi, type Booking } from '@/api/bookings';
import { tenantsApi } from '@/api/tenants';
import { unitsApi } from '@/api/units';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, Th, Td, Pagination } from '@/components/ui/Table';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate } from '@/lib/utils';

const schema = z.object({
  unitId: z.string().min(1, 'Unit is required'),
  tenantId: z.string().min(1, 'Guest is required'),
  startDate: z.string().min(1, 'Check-in is required'),
  endDate: z.string().min(1, 'Check-out is required'),
  dailyRate: z.coerce.number().positive('Daily rate must be positive'),
  discount: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});
type FormData = z.output<typeof schema>;

export default function BookingsPage() {
  const { isManagerOrAdmin } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [preview, setPreview] = useState({ days: 0, total: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page],
    queryFn: () => bookingsApi.list({ page, limit: 20 }),
  });

  const { data: tenantsData } = useQuery({ queryKey: ['tenants-all'], queryFn: () => tenantsApi.list({ limit: 200 }) });
  const { data: unitsData } = useQuery({
    queryKey: ['units-airbnb'],
    queryFn: () => unitsApi.list({ limit: 200, unitType: 'AIRBNB' }),
  });

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<z.input<typeof schema>, unknown, FormData>({ resolver: zodResolver(schema), defaultValues: { discount: 0 } });

  const [startDate, endDate, dailyRate, discount] = watch(['startDate', 'endDate', 'dailyRate', 'discount']);

  useEffect(() => {
    if (startDate && endDate && dailyRate) {
      const days = Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000));
      const total = Math.max(0, Number(dailyRate) * days - Number(discount ?? 0));
      setPreview({ days, total });
    }
  }, [startDate, endDate, dailyRate, discount]);

  const createMutation = useMutation({
    mutationFn: (d: FormData) => bookingsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); setModalOpen(false); reset(); setPreview({ days: 0, total: 0 }); },
    onError: (err: any) => setFormError(err.response?.data?.message ?? 'Booking failed'),
  });

  const bookings = data?.data ?? [];
  const pagination = data?.pagination;
  const tenants = tenantsData?.data ?? [];
  const airbnbUnits = unitsData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AirBnB Bookings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage short-stay bookings</p>
        </div>
        {isManagerOrAdmin() && (
          <Button onClick={() => { setFormError(''); reset({ discount: 0 }); setPreview({ days: 0, total: 0 }); setModalOpen(true); }}>
            <Plus size={16} className="mr-1" /> New Booking
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}</div>
      ) : (
        <>
          <Table>
            <TableHead>
              <tr>
                <Th>Guest</Th>
                <Th>Unit / Property</Th>
                <Th>Check-In</Th>
                <Th>Check-Out</Th>
                <Th>Nights</Th>
                <Th>Daily Rate</Th>
                <Th>Discount</Th>
                <Th>Total</Th>
              </tr>
            </TableHead>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow><Td colSpan={8} className="text-center text-slate-400 py-8">No bookings found</Td></TableRow>
              ) : (
                bookings.map((b: Booking) => (
                  <TableRow key={b.id}>
                    <Td className="font-medium">{b.tenant?.firstName} {b.tenant?.lastName}</Td>
                    <Td>{b.unit?.property?.name} — {b.unit?.unitNumber}</Td>
                    <Td>{formatDate(b.startDate)}</Td>
                    <Td>{formatDate(b.endDate)}</Td>
                    <Td>{b.days}</Td>
                    <Td>{formatCurrency(b.dailyRate)}</Td>
                    <Td>{formatCurrency(b.discount)}</Td>
                    <Td className="font-semibold">{formatCurrency(b.totalAmount)}</Td>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New AirBnB Booking" size="lg">
        {formError && <Alert variant="error" message={formError} className="mb-4" />}
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select id="unitId" label="AirBnB Unit *" error={errors.unitId?.message}
              options={airbnbUnits.map((u: any) => ({ value: u.id, label: `${u.property?.name} — ${u.unitNumber}` }))}
              placeholder="Select unit" {...register('unitId')} />
            <Select id="tenantId" label="Guest *" error={errors.tenantId?.message}
              options={tenants.map((t: any) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))}
              placeholder="Select guest" {...register('tenantId')} />
            <Input id="startDate" label="Check-In Date *" type="date" error={errors.startDate?.message} {...register('startDate')} />
            <Input id="endDate" label="Check-Out Date *" type="date" error={errors.endDate?.message} {...register('endDate')} />
            <Input id="dailyRate" label="Daily Rate (TSh) *" type="number" step="0.01" error={errors.dailyRate?.message} {...register('dailyRate')} />
            <Input id="discount" label="Discount (TSh)" type="number" step="0.01" {...register('discount')} />
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 block mb-1">Notes</label>
              <textarea rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('notes')} />
            </div>
          </div>

          {/* Live Preview */}
          {preview.days > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Nights: <strong>{preview.days}</strong></span>
                <span className="text-slate-600">Total: <strong className="text-blue-700 text-base">{formatCurrency(preview.total)}</strong></span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || createMutation.isPending}>Create Booking</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
