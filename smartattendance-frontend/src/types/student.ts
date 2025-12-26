export interface Student {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  groupe_id: number | null;
  photo_path: string | null;
}