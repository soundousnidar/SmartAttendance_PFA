export interface Module {
  id: number;
  code: string;
  nom: string;
  filiere_id: number;
  annee: number;
  filiere?: {
    id: number;
    code: string;
    nom: string;
  };
}

export interface ModuleCreate {
  code: string;
  nom: string;
  filiere_id: number;
  annee: number;
}