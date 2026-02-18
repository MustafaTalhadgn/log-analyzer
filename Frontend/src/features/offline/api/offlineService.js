import { apiClient } from '../../../shared/api/client';

export const offlineService = {
  uploadLog: async (file, logType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('log_type', logType);

    const response = await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getJobs: async () => {
    const response = await apiClient.get('/jobs');
    return response.data;
  },

  getAlertsByJob: async (jobId) => {
    const response = await apiClient.get(`/alerts?job_id=${jobId}`);
    return response.data;
  },

  deleteJob: async (jobId) => {
    const response = await apiClient.delete(`/jobs/${jobId}`);
    return response.data;
  },
};
