import api from './api';
import { Enseignant } from '../types/enseignant';

export const enseignantAPI = {
  getPending: async (): Promise<Enseignant[]> => {
    const response = await api.get('/enseignants/pending');
    return response.data;
  },

  getActive: async (): Promise<Enseignant[]> => {
    const response = await api.get('/enseignants/active');
    return response.data;
  },

  uploadPhoto: async (enseignantId: number, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post(`/enseignants/${enseignantId}/upload-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  activate: async (enseignantId: number): Promise<void> => {
    await api.post(`/enseignants/${enseignantId}/activate`);
  },

  delete: async (enseignantId: number): Promise<void> => {
    await api.delete(`/enseignants/${enseignantId}`);
  },
};