import { apiClient } from '../../../shared/api/client';

export const ruleService = {
  getRules: async () => {
    const response = await apiClient.get('/rules');
    return response.data;
  },

  createRule: async (ruleData) => {
    const response = await apiClient.post('/rules', ruleData);
    return response.data;
  },

  deleteRule: async (id) => {
    const response = await apiClient.delete(`/rules/${id}`);
    return response.data;
  }
};