import api from './api';
import { Enseignant } from '../types/enseignant';

export interface TeacherDashboardStats {
  total_cours_semaine: number;
  cours_aujourdhui: number;
  total_etudiants: number;
  taux_presence_moyen: number;
}

export interface CoursAujourdhui {
  id: number;
  heure: string;
  cours: string;
  niveau: number;
  groupe: string;
  salle: string;
  presents: number;
  absents: number;
  retards: number;
  total: number;
}

export interface TauxParCours {
  cours: string;
  taux: number;
}

export interface EtudiantRisque {
  nom: string;
  cours: string;
  niveau: string;
  absences: number;
  taux_presence: number;
}

export interface TeacherDashboardResponse {
  stats: TeacherDashboardStats;
  cours_aujourdhui: CoursAujourdhui[];
  evolution_presence: number[];
  taux_presence_par_cours: TauxParCours[];
  etudiants_a_risque: EtudiantRisque[];
}

export const enseignantAPI = {
  getPending: async (): Promise<Enseignant[]> => {
    const response = await api.get('/enseignants/pending');
    return response.data;
  },

  getActive: async (): Promise<Enseignant[]> => {
    const response = await api.get('/enseignants/active');
    return response.data;
  },

  getDashboard: async (): Promise<TeacherDashboardResponse> => {
    const response = await api.get('/enseignants/dashboard');
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

  getCours: async (): Promise<any[]> => {
    const response = await api.get('/enseignants/cours');
    return response.data;
  },

  getSchedule: async (filiere?: string, niveau?: number, groupe?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filiere) params.append('filiere', filiere);
    if (niveau) params.append('niveau', niveau.toString());
    if (groupe) params.append('groupe', groupe);
    const response = await api.get(`/enseignants/schedule?${params.toString()}`);
    return response.data;
  },

  getNotifications: async (limit: number = 10): Promise<any[]> => {
    const response = await api.get(`/enseignants/notifications?limit=${limit}`);
    return response.data;
  },

  getSeances: async (): Promise<any[]> => {
    const response = await api.get('/enseignants/seances');
    return response.data;
  },
};