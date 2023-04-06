// import { PartialType } from '@nestjs/mapped-types';
// import { CreateUserDto } from './create-user.dto';

// export class UpdateUserDto extends PartialType(CreateUserDto) {}
import { IsDate, IsOptional, IsString } from 'class-validator';
import { User } from '../entities/user.entity';

export class UpdateUserDto extends User {
  @IsString()
  name: string;

  @IsOptional()
  @IsDate()
  updatedAt: Date;
}
