export interface Enseignant {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  photo_path: string | null;
}