import axios from "axios";

const API_BASE_URL = "http://localhost:8086/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Axios Request Interceptor: Automatically attach Bearer JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("hospital_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Axios Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("hospital_token");
      localStorage.removeItem("hospital_user");
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication APIs
 */
export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const fetchMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

/**
 * Hospital SaaS Tenant & Approval APIs (Super Admin)
 */
export const registerHospital = async (data) => {
  const response = await api.post("/super-admin/hospitals/register", data);
  return response.data;
};

export const fetchHospitals = async (params = {}) => {
  const response = await api.get("/super-admin/hospitals", { params });
  return response.data;
};

export const approveHospital = async (id) => {
  const response = await api.put(`/super-admin/hospitals/${id}/approve`);
  return response.data;
};

export const rejectHospital = async (id) => {
  const response = await api.put(`/super-admin/hospitals/${id}/reject`);
  return response.data;
};

/**
 * User Management APIs
 */
export const fetchUsers = async (params = {}) => {
  const response = await api.get("/super-admin/users", { params });
  return response.data;
};

export const fetchUserById = async (id) => {
  const response = await api.get(`/super-admin/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post("/super-admin/users", userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/super-admin/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/super-admin/users/${id}`);
  return response.data;
};

export const enableUser = async (id) => {
  const response = await api.put(`/super-admin/users/${id}/enable`);
  return response.data;
};

export const disableUser = async (id) => {
  const response = await api.put(`/super-admin/users/${id}/disable`);
  return response.data;
};

export default api;
