import api from './client';

export type Unit = {
  id: string;
  propertyId: string;
  unitNumber: string;
  unitType: 'APARTMENT' | 'STUDIO' | 'AIRBNB' | 'OTHER';
  bedrooms: number;
  monthlyRent?: number | null;
  dailyRate?: number | null;
  serviceCharge: number;
  property?: { id: string; name: string; location: string };
  assignments?: Assignment[];
};

export type Assignment = {
  id: string;
  unitId: string;
  tenantId: string;
  checkInDate: string;
  checkOutDate?: string;
  isActive: boolean;
  tenant?: { id: string; firstName: string; lastName: string; phone: string };
};

export const unitsApi = {
  list: (params?: { page?: number; limit?: number; propertyId?: string; unitType?: string; search?: string }) =>
    api.get('/units', { params }).then((r) => r.data),

  get: (id: string) => api.get(`/units/${id}`).then((r) => r.data.data),

  create: (data: Omit<Unit, 'id' | 'property' | 'assignments'>) =>
    api.post('/units', data).then((r) => r.data.data),

  update: (id: string, data: Partial<Omit<Unit, 'id' | 'property' | 'assignments'>>) =>
    api.put(`/units/${id}`, data).then((r) => r.data.data),

  delete: (id: string) => api.delete(`/units/${id}`),
};

export const assignmentsApi = {
  getByUnit: (unitId: string) =>
    api.get(`/assignments/unit/${unitId}`).then((r) => r.data.data),

  assign: (data: { unitId: string; tenantId: string; checkInDate: string }) =>
    api.post('/assignments', data).then((r) => r.data.data),

  checkout: (id: string) =>
    api.patch(`/assignments/${id}/checkout`).then((r) => r.data.data),
};
