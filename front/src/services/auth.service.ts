import axiosClient from "@/lib/axios-client";

export const authService = {
  login: (data: {email: string, password: string}) => {
    return axiosClient.post('/auth/login', data);
  },
  
  register: (data: {fullName: string, email: string, password: string}) => {
    return axiosClient.post('/auth/register', data);
  },
  
  // Ví dụ thêm API khác sau này
  getProfile: () => {
    return axiosClient.get('/users/me');
  }
};