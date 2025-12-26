import axios from 'axios';
import { Module, ModuleCreate } from '../types/module';

const API_URL = 'http://127.0.0.1:8000'; // Même URL que api.ts

const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const moduleAPI = {
  getAll: async (): Promise<Module[]> => {
    const response = await axios.get(`${API_URL}/modules/`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  getById: async (id: number): Promise<Module> => {
    const response = await axios.get(`${API_URL}/modules/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  create: async (data: ModuleCreate): Promise<Module> => {
    const response = await axios.post(`${API_URL}/modules/`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  update: async (id: number, data: ModuleCreate): Promise<Module> => {
    const response = await axios.put(`${API_URL}/modules/${id}`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/modules/${id}`, {
      headers: getAuthHeader(),
    });
  },
};