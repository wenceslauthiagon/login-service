import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @IsPublic()
  @Post()
  create(@Body() data: CreateUserDto) {
    return this.userService.create(data);
  }

  @IsPublic()
  @Get('/all')
  findAll() {
    console.log('Nothing');
    return this.userService.findAll();
  }

  // @Get(':email')
  // findOne(@Param('email') email: string) {
  //   return this.userService.findByEmail(email);
  // }

  @IsPublic()
  @Patch(':email')
  async update(@Param('email') email: string, @Body() data: UpdateUserDto) {
    return await this.userService.update(email, data);
  }

  @IsPublic()
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<User> {
    return this.userService.destroy(id);
  }
}
