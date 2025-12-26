import api from './api';
import { Student } from '../types/student';

export const studentAPI = {
  getPending: async (): Promise<Student[]> => {
    const response = await api.get('/students/pending');
    return response.data;
  },

  getActive: async (): Promise<Student[]> => {
    const response = await api.get('/students/active');
    return response.data;
  },

  uploadPhoto: async (studentId: number, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post(`/students/${studentId}/upload-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  assignGroupe: async (studentId: number, groupeId: number): Promise<void> => {
    await api.put(`/students/${studentId}/assign-groupe`, { groupe_id: groupeId });
  },

  activate: async (studentId: number): Promise<void> => {
    await api.post(`/students/${studentId}/activate`);
  },

  delete: async (studentId: number): Promise<void> => {
    await api.delete(`/students/${studentId}`);
  },
};