import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingsApi, type Booking, BOOKING_SOURCE_LABELS } from '@/api/bookings';
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
import { formatCurrency, formatDate } from '@/lib/utils';

const schema = z.object({
  unitId: z.string().min(1, 'Unit is required'),
  guestName: z.string().min(1, 'Guest name is required'),
  guestPhone: z.string().optional(),
  bookingSource: z.enum(['SELF_BOOKING', 'BOOKING_COM', 'OTHER']),
  bookingSourceOther: z.string().optional(),
  startDate: z.string().min(1, 'Check-in date is required'),
  endDate: z.string().min(1, 'Check-out date is required'),
  dailyRate: z.coerce.number().positive('Daily rate must be positive'),
  discount: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
}).refine(
  (d) => d.bookingSource !== 'OTHER' || (d.bookingSourceOther ?? '').trim().length > 0,
  { message: 'Please specify the booking source', path: ['bookingSourceOther'] }
);

type FormData = z.output<typeof schema>;

const sourceVariant: Record<string, 'info' | 'success' | 'default'> = {
  SELF_BOOKING: 'success',
  BOOKING_COM: 'info',
  OTHER: 'default',
};

export default function BookingsPage() {
  const { isManagerOrAdmin } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterSource, setFilterSource] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [preview, setPreview] = useState({ days: 0, total: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page, filterSource],
    queryFn: () =>
      bookingsApi.list({
        page,
        limit: 20,
        bookingSource: filterSource || undefined,
      }),
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units-airbnb'],
    queryFn: () => unitsApi.list({ limit: 200, unitType: 'AIRBNB' }),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof schema>, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: { discount: 0, bookingSource: 'SELF_BOOKING' },
  });

  const [startDate, endDate, dailyRate, discount, bookingSource] = watch([
    'startDate', 'endDate', 'dailyRate', 'discount', 'bookingSource',
  ]);

  useEffect(() => {
    if (startDate && endDate && dailyRate) {
      const days = Math.max(
        0,
        Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
      );
      const total = Math.max(0, Number(dailyRate) * days - Number(discount ?? 0));
      setPreview({ days, total });
    } else {
      setPreview({ days: 0, total: 0 });
    }
  }, [startDate, endDate, dailyRate, discount]);

  const createMutation = useMutation({
    mutationFn: (d: FormData) => bookingsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      setModalOpen(false);
      reset({ discount: 0, bookingSource: 'SELF_BOOKING' });
      setPreview({ days: 0, total: 0 });
    },
    onError: (err: any) => setFormError(err.response?.data?.message ?? 'Booking failed'),
  });

  function openModal() {
    setFormError('');
    reset({ discount: 0, bookingSource: 'SELF_BOOKING' });
    setPreview({ days: 0, total: 0 });
    setModalOpen(true);
  }

  const bookings = data?.data ?? [];
  const pagination = data?.pagination;
  const airbnbUnits = unitsData?.data ?? [];

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: 22, color: '#333' }}>AirBnB Bookings</h1>
          <p className="text-muted small mt-1">Manage short-stay guest bookings</p>
        </div>
        {isManagerOrAdmin() && (
          <Button onClick={openModal}>
            <i className="fas fa-plus me-1" /> New Booking
          </Button>
        )}
      </div>

      {/* Filter by source */}
      <Card>
        <CardContent className="py-3">
          <div className="d-flex align-items-center gap-3">
            <label className="text-sm text-slate-500">Filter by source:</label>
            <select
              className="form-select form-select-sm"
              value={filterSource}
              onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
            >
              <option value="">All Sources</option>
              {(Object.entries(BOOKING_SOURCE_LABELS) as [string, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="d-flex flex-column gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded animate-pulse-lbd" style={{ height: 56, background: '#f0f0f0' }} />
          ))}
        </div>
      ) : (
        <>
          <Table>
            <TableHead>
              <tr>
                <Th>Guest</Th>
                <Th>Phone</Th>
                <Th>Source</Th>
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
                <TableRow>
                  <Td colSpan={10} className="text-center text-muted py-5">
                    No bookings found
                  </Td>
                </TableRow>
              ) : (
                bookings.map((b: Booking) => {
                  const sourceLabel =
                    b.bookingSource === 'OTHER' && b.bookingSourceOther
                      ? b.bookingSourceOther
                      : BOOKING_SOURCE_LABELS[b.bookingSource] ?? b.bookingSource;
                  return (
                    <TableRow key={b.id}>
                      <Td className="fw-medium">{b.guestName}</Td>
                      <Td className="text-muted">{b.guestPhone ?? '—'}</Td>
                      <Td>
                        <Badge variant={sourceVariant[b.bookingSource] ?? 'default'}>
                          {sourceLabel}
                        </Badge>
                      </Td>
                      <Td>{b.unit?.property?.name} — {b.unit?.unitNumber}</Td>
                      <Td>{formatDate(b.startDate)}</Td>
                      <Td>{formatDate(b.endDate)}</Td>
                      <Td>{b.days}</Td>
                      <Td>{formatCurrency(b.dailyRate)}</Td>
                      <Td>{formatCurrency(b.discount)}</Td>
                      <Td className="fw-semibold">{formatCurrency(b.totalAmount)}</Td>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {pagination && pagination.totalPages > 1 && (
            <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      {/* New Booking Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New AirBnB Booking" size="lg">
        {formError && <Alert variant="error" message={formError} className="mb-4" />}
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="d-flex flex-column gap-3">
          <div className="row g-2">

            {/* Unit */}
            <div className="col-12">
              <Select
                id="unitId"
                label="AirBnB Unit *"
                error={errors.unitId?.message}
                options={airbnbUnits.map((u: any) => ({
                  value: u.id,
                  label: `${u.property?.name} — ${u.unitNumber}`,
                }))}
                placeholder="Select unit"
                {...register('unitId')}
              />
            </div>

            {/* Guest name — free text */}
            <Input
              id="guestName"
              label="Guest Name *"
              placeholder="Full name of the guest"
              error={errors.guestName?.message}
              {...register('guestName')}
            />

            {/* Guest phone */}
            <Input
              id="guestPhone"
              label="Guest Phone"
              type="tel"
              placeholder="+255 700 000 000"
              {...register('guestPhone')}
            />

            {/* Booking Source */}
            <div className="row g-2">
              <Select
                id="bookingSource"
                label="Booking Source *"
                error={errors.bookingSource?.message}
                options={[
                  { value: 'SELF_BOOKING', label: 'Self Booking' },
                  { value: 'BOOKING_COM', label: 'Booking.com' },
                  { value: 'OTHER', label: 'Others' },
                ]}
                {...register('bookingSource')}
              />

              {/* Specify "Others" */}
              {bookingSource === 'OTHER' && (
                <Input
                  id="bookingSourceOther"
                  label="Specify Source *"
                  placeholder="e.g. Airbnb, Expedia, Direct call…"
                  error={errors.bookingSourceOther?.message}
                  {...register('bookingSourceOther')}
                />
              )}
            </div>

            {/* Dates */}
            <Input
              id="startDate"
              label="Check-In Date *"
              type="date"
              error={errors.startDate?.message}
              {...register('startDate')}
            />
            <Input
              id="endDate"
              label="Check-Out Date *"
              type="date"
              error={errors.endDate?.message}
              {...register('endDate')}
            />

            {/* Rate & Discount */}
            <Input
              id="dailyRate"
              label="Daily Rate (TSh) *"
              type="number"
              step="0.01"
              error={errors.dailyRate?.message}
              {...register('dailyRate')}
            />
            <Input
              id="discount"
              label="Discount (TSh)"
              type="number"
              step="0.01"
              {...register('discount')}
            />

            {/* Notes */}
            <div className="col-12">
              <label className="text-sm font-medium text-slate-700 block mb-1">Notes</label>
              <textarea
                rows={2}
                className="form-control"
                placeholder="Any special requests or remarks…"
                {...register('notes')}
              />
            </div>
          </div>

          {/* Live price preview */}
          {preview.days > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
              <span className="text-secondary">
                <strong>{preview.days}</strong> night{preview.days !== 1 ? 's' : ''}
              </span>
              <span className="text-secondary">
                Total:{' '}
                <strong className="text-blue-700 text-base">{formatCurrency(preview.total)}</strong>
              </span>
            </div>
          )}

          <div className="d-flex justify-content-end gap-3 pt-3 mt-2 border-top">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting || createMutation.isPending}>
              Create Booking
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
