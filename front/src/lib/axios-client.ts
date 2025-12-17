import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Tự động lấy từ .env
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor Request: Gắn token vào mọi request
axiosClient.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    // Lưu ý: Backend trả về field là 'accessToken', check kỹ log response
    if (user.accessToken) {
        config.headers.Authorization = `Bearer ${user.accessToken}`;
    }
  }
  return config;
});

// Interceptor Response: Xử lý lỗi chung (VD: 401 Unauthorized)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ -> Xóa storage và đá về login
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;