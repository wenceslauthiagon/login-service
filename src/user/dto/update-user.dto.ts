import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Full name', example: 'Full Name' })
  @IsOptional()
  @IsString()
  name?: string;

}
