import api from './client';

export type Payment = {
  id: string;
  tenantId: string;
  unitId: string;
  paymentType: 'RENT' | 'SERVICE_CHARGE' | 'AIRBNB';
  amount: number;
  paymentDate: string;
  periodStart: string;
  periodEnd: string;
  recordedById: string;
  notes?: string;
  tenant?: { id: string; firstName: string; lastName: string };
  unit?: { id: string; unitNumber: string; property?: { name: string } };
  recordedBy?: { firstName: string; lastName: string };
};

export const paymentsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    tenantId?: string;
    unitId?: string;
    propertyId?: string;
    paymentType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => api.get('/payments', { params }).then((r) => r.data),

  get: (id: string) => api.get(`/payments/${id}`).then((r) => r.data.data),

  create: (data: Omit<Payment, 'id' | 'recordedById' | 'tenant' | 'unit' | 'recordedBy'>) =>
    api.post('/payments', data).then((r) => r.data.data),

  tenantLedger: (tenantId: string) =>
    api.get(`/payments/tenant/${tenantId}`).then((r) => r.data.data),
};
