export interface Module {
  id: number;
  code: string;
  nom: string;
}

export interface ModuleCreate {
  code: string;
  nom: string;
}