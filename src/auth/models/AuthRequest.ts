import { Request } from 'express';
import { User } from 'src/user/entities/user.entity';

export interface AuthResquest extends Request {
  user: User;
}
