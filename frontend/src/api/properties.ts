import api from './client';

export type Property = {
  id: string;
  name: string;
  location: string;
  description?: string;
  createdAt: string;
  _count?: { units: number };
};

export const propertiesApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/properties', { params }).then((r) => r.data),

  get: (id: string) => api.get(`/properties/${id}`).then((r) => r.data.data),

  create: (data: { name: string; location: string; description?: string }) =>
    api.post('/properties', data).then((r) => r.data.data),

  update: (id: string, data: Partial<{ name: string; location: string; description: string }>) =>
    api.put(`/properties/${id}`, data).then((r) => r.data.data),

  delete: (id: string) => api.delete(`/properties/${id}`),
};
