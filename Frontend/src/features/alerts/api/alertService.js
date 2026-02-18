import { apiClient } from '../../../shared/api/client';

export const alertService = {
  getAlerts: async () => {
    // Backend'deki endpoint: GET /api/alerts
    const response = await apiClient.get('/alerts');
    return response.data;
  },

  markAsReviewed: async (alertId) => {
    const response = await apiClient.put(`/alerts/${alertId}/review`);
    return response.data;
  },

  markAsUnreviewed: async (alertId) => {
    const response = await apiClient.put(`/alerts/${alertId}/unreview`);
    return response.data;
  },

  exportAlerts: async (format = 'csv') => {
    const response = await apiClient.get(`/alerts/export/${format}`, {
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return response.data;
  },
};