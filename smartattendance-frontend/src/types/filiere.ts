export interface Filiere {
  id: number;
  code: string;
  nom: string;
}

export interface FiliereCreate {
  code: string;
  nom: string;
}