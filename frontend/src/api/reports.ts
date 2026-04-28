import api from './client';

export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard').then((r) => r.data.data),

  rental: (params?: { propertyId?: string; unitId?: string; dateFrom?: string; dateTo?: string }) =>
    api.get('/reports/rental', { params }).then((r) => r.data.data),

  airbnb: (params?: { propertyId?: string; unitId?: string; dateFrom?: string; dateTo?: string }) =>
    api.get('/reports/airbnb', { params }).then((r) => r.data.data),

  occupancy: (params?: { propertyId?: string }) =>
    api.get('/reports/occupancy', { params }).then((r) => r.data.data),

  upcomingCollections: (days = 45) =>
    api.get('/reports/upcoming-collections', { params: { days } }).then((r) => r.data.data),

  exportReport: (params: {
    format: 'pdf' | 'excel';
    type: 'rental' | 'airbnb' | 'occupancy';
    dateFrom?: string;
    dateTo?: string;
    propertyId?: string;
  }) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    window.open(`/api/reports/export?${query}`, '_blank');
  },

  auditLogs: (params?: { page?: number; limit?: number; userId?: string; entity?: string }) =>
    api.get('/audit-logs', { params }).then((r) => r.data),
};
