import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import PaginetdHelper from './helpers/user-pagineted.helpers';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() data: CreateUserDto) {
    return this.userService.create(data);
  }

  @IsPublic()
  @Get('/all')
  async findAll(
    @Query('page') page?: number,
    @Query('limitPerpage') limitPerpage?: number,
  ): Promise<PaginetdHelper<User[]>> {
    return await this.userService.findAllUsers(page, limitPerpage);
  }

  // @Get(':email')
  // findOne(@Param('email') email: string) {
  //   return this.userService.findByEmail(email);
  // }

  @Patch(':email')
  async update(@Param('email') email: string, @Body() data: UpdateUserDto) {
    return await this.userService.update(email, data);
  }

  @Delete(':email')
  async delete(@Param('email') email: string): Promise<User> {
    return this.userService.destroy(email);
  }
}
