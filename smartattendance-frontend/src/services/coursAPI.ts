import api from './api';
import { Cours, CoursCreate } from '../types/cours';

export const coursAPI = {
  getAll: async (): Promise<Cours[]> => {
    const response = await api.get('/cours/');
    return response.data;
  },

  getByGroupe: async (groupeId: number): Promise<Cours[]> => {
    const response = await api.get(`/cours/groupe/${groupeId}`);
    return response.data;
  },

  getByEnseignant: async (enseignantId: number): Promise<Cours[]> => {
    const response = await api.get(`/cours/enseignant/${enseignantId}`);
    return response.data;
  },

  create: async (data: CoursCreate): Promise<Cours> => {
    const response = await api.post('/cours/', data);
    return response.data;
  },

  update: async (id: number, data: CoursCreate): Promise<Cours> => {
    const response = await api.put(`/cours/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/cours/${id}`);
  },
};