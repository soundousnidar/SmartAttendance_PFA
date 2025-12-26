export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  full_name: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'enseignant' | 'student';
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}