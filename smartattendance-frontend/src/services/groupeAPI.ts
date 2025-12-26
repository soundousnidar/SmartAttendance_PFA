import api from './api';  
import { Groupe, GroupeCreate } from '../types/groupe';

export const groupeAPI = {
  getAll: async (): Promise<Groupe[]> => {
    const response = await api.get('/groupes/');
    return response.data;
  },

  getByFiliere: async (filiereId: number): Promise<Groupe[]> => {
    const response = await api.get(`/groupes/filiere/${filiereId}`);
    return response.data;
  },

  create: async (data: GroupeCreate): Promise<Groupe> => {
    const response = await api.post('/groupes/', data);
    return response.data;
  },

  update: async (id: number, data: GroupeCreate): Promise<Groupe> => {
    const response = await api.put(`/groupes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/groupes/${id}`);
  },
};