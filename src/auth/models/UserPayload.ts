export interface UserPayload {
  sub: string;
  email: string;
  name: string;
  active: boolean;
  iat?: number;
  exp?: number;
}
