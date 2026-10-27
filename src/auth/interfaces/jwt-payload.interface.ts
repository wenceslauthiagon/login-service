export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  active: boolean;
  iat?: number;
  exp?: number;
}