export interface UserResponse {
  id: string;
  document: string;
  email: string;
  name: string;
  active: boolean;
  created_at: Date;
  deleted_at: Date | null;
  updated_at: Date | null;
}