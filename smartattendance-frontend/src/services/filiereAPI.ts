import api from './api';
import { Filiere, FiliereCreate } from '../types/filiere';

export const filiereAPI = {
  getAll: async (): Promise<Filiere[]> => {
    const response = await api.get('/filieres/');
    return response.data;
  },

  getById: async (id: number): Promise<Filiere> => {
    const response = await api.get(`/filieres/${id}`);
    return response.data;
  },

  create: async (data: FiliereCreate): Promise<Filiere> => {
    const response = await api.post('/filieres/', data);
    return response.data;
  },

  update: async (id: number, data: FiliereCreate): Promise<Filiere> => {
    const response = await api.put(`/filieres/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/filieres/${id}`);
  },
};