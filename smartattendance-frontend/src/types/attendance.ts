export interface Attendance {
  id: number;
  seance_id: number;
  student_id: number;
  status: 'present' | 'late' | 'absent';
  confidence: number;
  timestamp: string;
}

export interface Seance {
  id: number;
  cours_id: number;
  date: string;
  is_active: boolean;
}

export interface CoursInfo {
  id: number;
  module: {
    id: number;
    code: string;
    nom: string;
  };
  groupe: {
    id: number;
    code: string;
  };
  enseignant: {
    id: number;
    full_name: string;
  };
  jour: string;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
}