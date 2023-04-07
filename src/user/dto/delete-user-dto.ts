import { IsDate, IsOptional, IsString } from 'class-validator';
import { User } from '../entities/user.entity';

export class DeleteUserDto extends User {
  @IsString()
  email: string;

  @IsOptional()
  active: boolean;

  @IsOptional()
  @IsDate()
  deletedAt?: Date;
}
