export interface Groupe {
  id: number;
  code: string;
  filiere_id: number;
  annee: number;
}

export interface GroupeCreate {
  code: string;
  filiere_id: number;
  annee: number;
}

export interface GroupeWithFiliere extends Groupe {
  filiere?: {
    id: number;
    code: string;
    nom: string;
  };
}