import api from './client';

export type Booking = {
  id: string;
  unitId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  days: number;
  dailyRate: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  unit?: { unitNumber: string; property?: { name: string } };
  tenant?: { id: string; firstName: string; lastName: string; phone: string };
};

export const bookingsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    unitId?: string;
    tenantId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => api.get('/bookings', { params }).then((r) => r.data),

  get: (id: string) => api.get(`/bookings/${id}`).then((r) => r.data.data),

  create: (data: {
    unitId: string;
    tenantId: string;
    startDate: string;
    endDate: string;
    dailyRate: number;
    discount?: number;
    notes?: string;
  }) => api.post('/bookings', data).then((r) => r.data.data),

  update: (id: string, data: Partial<Booking>) =>
    api.put(`/bookings/${id}`, data).then((r) => r.data.data),
};
