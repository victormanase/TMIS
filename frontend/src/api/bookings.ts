import api from './client';

export type BookingSource = 'SELF_BOOKING' | 'BOOKING_COM' | 'OTHER';

export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
  SELF_BOOKING: 'Self Booking',
  BOOKING_COM: 'Booking.com',
  OTHER: 'Others',
};

export type Booking = {
  id: string;
  unitId: string;
  guestName: string;
  guestPhone?: string;
  bookingSource: BookingSource;
  bookingSourceOther?: string;
  startDate: string;
  endDate: string;
  days: number;
  dailyRate: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  unit?: { unitNumber: string; property?: { name: string } };
};

export const bookingsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    unitId?: string;
    dateFrom?: string;
    dateTo?: string;
    bookingSource?: string;
  }) => api.get('/bookings', { params }).then((r) => r.data),

  get: (id: string) => api.get(`/bookings/${id}`).then((r) => r.data.data),

  create: (data: {
    unitId: string;
    guestName: string;
    guestPhone?: string;
    bookingSource: BookingSource;
    bookingSourceOther?: string;
    startDate: string;
    endDate: string;
    dailyRate: number;
    discount?: number;
    notes?: string;
  }) => api.post('/bookings', data).then((r) => r.data.data),

  update: (id: string, data: Partial<Booking>) =>
    api.put(`/bookings/${id}`, data).then((r) => r.data.data),
};
