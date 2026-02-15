import { apiClient } from '../../../shared/api/client';

export const alertService = {
  getAlerts: async () => {
    // Backend'deki endpoint: GET /api/alerts
    const response = await apiClient.get('/alerts');
    return response.data;
  }
};