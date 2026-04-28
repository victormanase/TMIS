import api from './client';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'VIEWER';
  isActive: boolean;
  createdAt: string;
};

export const usersApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/users', { params }).then((r) => r.data),

  get: (id: string) => api.get(`/users/${id}`).then((r) => r.data.data),

  create: (data: Omit<User, 'id' | 'createdAt' | 'isActive'> & { password: string }) =>
    api.post('/users', data).then((r) => r.data.data),

  update: (id: string, data: Partial<User & { password: string }>) =>
    api.put(`/users/${id}`, data).then((r) => r.data.data),

  delete: (id: string) => api.delete(`/users/${id}`),

  toggleActive: (id: string) =>
    api.patch(`/users/${id}/toggle-active`).then((r) => r.data.data),
};
