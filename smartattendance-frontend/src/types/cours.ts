export interface Cours {
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

export interface CoursCreate {
  module_id: number;
  groupe_id: number;
  enseignant_id: number;
  jour: string;
  heure_debut: string;
  heure_fin: string;
  salle: string;
}