import axios from 'axios';

// Backend adresini buradan yönetiriz. Yarın sunucu değişirse tek burayı değiştirirsin.
export const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 saniye zaman aşımı
});

// Response interceptor: Hataları merkezi yakalamak için (Opsiyonel ama pro hareket)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Hatası:", error?.response?.data || error.message);
    return Promise.reject(error);
  }
);