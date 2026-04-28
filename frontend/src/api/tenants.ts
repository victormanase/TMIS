import api from './client';

export type Tenant = {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  createdAt: string;
  assignments?: Array<{
    id: string;
    isActive: boolean;
    checkInDate: string;
    checkOutDate?: string;
    unit: { id: string; unitNumber: string; property: { name: string } };
  }>;
};

export const tenantsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/tenants', { params }).then((r) => r.data),

  get: (id: string) => api.get(`/tenants/${id}`).then((r) => r.data.data),

  create: (data: { firstName: string; middleName?: string; lastName: string; phone: string }) =>
    api.post('/tenants', data).then((r) => r.data.data),

  update: (id: string, data: Partial<Tenant>) =>
    api.put(`/tenants/${id}`, data).then((r) => r.data.data),

  delete: (id: string) => api.delete(`/tenants/${id}`),
};
