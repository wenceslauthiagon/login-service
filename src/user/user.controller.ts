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
import { FindUserDto } from './dto/find-user.dto';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
import { User } from '@prisma/client';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() data: CreateUserDto) {
    return this.userService.create(data);
  }

  // @IsPublic()
  // @Get('/all')
  // async findAll(
  //   @Param('params') skip?: number,
  //   take?: number,
  // ): Promise<User[]> {
  //   return await this.userService.findAll(skip, take);
  // }

  // @IsPublic()
  // @Get('/all')
  // async findAllUsers(@Request() req, @Response() res): Promise<User[]> {
  //   const { page, size, sort, order, search } = req.query;

  //   const result = await this.userService.findAll({
  //     page,
  //     size,
  //     sort,
  //     order,
  //     search,
  //   });

  //   return res.json(search);
  // request.query.hasOwnProperty('page') ? request.query.page : 0,
  // request.query.hasOwnProperty('size') ? request.query.size : 10,
  // request.query.hasOwnProperty('sort') ? request.query.cursor : '',
  // request.query.hasOwnProperty('order') ? request.query.where : 'asc',
  // request.query.hasOwnProperty('search') ? request.query : 'asc',
  // }

  // @Get('pages')
  // async pagination(@Request() req) {
  //   return await this.userService.paginate();
  // }

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
