import { apiClient } from '../../../shared/api/client';

export const dashboardService = {
  // İstatistikleri getir (Severity sayıları)
  getStats: async () => {
    const response = await apiClient.get('/stats');
    return response.data;
  },

  // Son N gun icin alarm sayilari
  getDailyStats: async (days = 7) => {
    const response = await apiClient.get(`/stats/daily?days=${days}`);
    return response.data;
  },

  // Son alarmları getir
  getRecentAlerts: async () => {
    // Backend'de ?limit=10 gibi bir parametre ekleyebiliriz ileride, şimdilik hepsi geliyor
    const response = await apiClient.get('/alerts');
    return response.data;
  }
};