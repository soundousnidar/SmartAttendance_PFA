import api from './api';
import { Attendance, Seance, CoursInfo } from '../types/attendance';

export const attendanceAPI = {
  markAttendance: async (seanceId: number, file: File): Promise<Attendance> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/attendance/mark/${seanceId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getBySeance: async (seanceId: number): Promise<Attendance[]> => {
    const response = await api.get(`/attendance/seance/${seanceId}`);
    return response.data;
  },

  getByStudent: async (studentId: number): Promise<Attendance[]> => {
    const response = await api.get(`/attendance/student/${studentId}`);
    return response.data;
  },
};

export const seanceAPI = {
  start: async (coursId: number): Promise<Seance> => {
    const response = await api.post(`/seances/start/${coursId}`);
    return response.data;
  },

  end: async (seanceId: number): Promise<void> => {
    await api.post(`/seances/end/${seanceId}`);
  },

  getByCours: async (coursId: number): Promise<Seance[]> => {
    const response = await api.get(`/seances/cours/${coursId}`);
    return response.data;
  },
};