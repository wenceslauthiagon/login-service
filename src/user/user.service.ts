import { Injectable } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { randomUUID } from 'crypto';
import PaginetdHelper from './helpers/user-pagineted.helpers';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const data: Prisma.UserCreateInput = {
      ...createUserDto,
      id: randomUUID(),
      createdAt: new Date(),
      active: true,
      password: await bcrypt.hash(createUserDto.password, 10),
    };

    const createdUser = await this.prismaService.user.create({
      data,
    });

    return {
      ...createdUser,
      password: undefined,
    };
  }

  async findAllUsers(
    page?: number,
    limitPerpage?: number,
  ): Promise<PaginetdHelper<User[]>> {
    const numberEntries = await this.prismaService.user.count();
    const paginetedHelper = new PaginetdHelper<User[]>(
      page,
      numberEntries,
      limitPerpage,
    );

    Object.assign({
      skip: paginetedHelper.offset,
      take: paginetedHelper.limitPerpage,
      order: {
        id: 'ASC',
      },
    });

    const data = await this.prismaService.user.findMany({
      where: {
        active: true,
      },
    });

    for (const users of data) {
      users.password = undefined;

      paginetedHelper.data = data;
      delete paginetedHelper.offset;
    }

    return paginetedHelper;
  }

  async findByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    return user;
  }

  async update(email: string, updateUserDto: UpdateUserDto): Promise<User> {
    const userExist = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!userExist) {
      throw new Error('User does not exist...');
    }

    const data: Prisma.UserUpdateInput = {
      ...updateUserDto,
      updatedAt: new Date(),
    };

    const updatedUser = await this.prismaService.user.update({
      data,
      where: {
        email,
      },
    });

    updatedUser.password = undefined;

    return updatedUser;
  }

  async destroy(email: string): Promise<User> {
    const userExist = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!userExist) {
      throw new Error('User does not exist...');
    }

    const data: Prisma.UserUpdateInput = {
      ...userExist,
      deletedAt: new Date(),
      active: false,
    };

    const deletedUser = await this.prismaService.user.update({
      data,
      where: {
        email,
      },
    });

    deletedUser.password = undefined;

    return deletedUser;
  }
}
