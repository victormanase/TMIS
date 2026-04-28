import api from './client';

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data.data),

  logout: () => api.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data.data),

  requestPasswordReset: (email: string) =>
    api.post('/auth/password-reset/request', { email }),

  confirmPasswordReset: (token: string, password: string) =>
    api.post('/auth/password-reset/confirm', { token, password }),
};
