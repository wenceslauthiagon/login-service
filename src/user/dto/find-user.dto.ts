import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';
import { User } from '../entities/user.entity';

export class FindUserDto extends User {
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsBoolean()
  active: boolean;

  @IsDateString()
  @IsOptional()
  createdAt: Date;

  @IsDateString()
  @IsOptional()
  updatedAt: Date;

  @IsDateString()
  @IsOptional()
  deletedAt: Date;

  @IsOptional()
  length: number;

  @IsOptional()
  size: number;

  @IsOptional()
  lastPage: number;

  @IsOptional()
  page: number;

  @IsOptional()
  startIndex: number;

  @IsOptional()
  endIndex: number;
}
