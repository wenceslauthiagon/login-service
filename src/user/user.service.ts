import { Injectable } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async paginate(
    page: number,
    size: number,
    sort: string,
    order: string,
    search: string,
  ) {
    const results = await this.prismaService.user.findMany({
      skip: page * size,
      take: Number(size),
      where: { name: { contains: search } },
      orderBy: { [sort]: order },
    });
    const totalItems = await this.prismaService.user.count({
      where: { name: { contains: search } },
    });
    return { results, totalItems };
  }

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

  async findAll(
    page: number,
    size: number,
    sort: string,
    order: string,
    search: string,
    skip?: number,
    take?: number,
  ) {
    const result = await this.prismaService.user.count();
    const user = await this.prismaService.user.findMany({
      skip,
      take,
    });
    console.log('allUser', user);
    console.log('results', result);
    // console.log('totalItems', totalItems);
    return user;
  }

  // async findAll(
  //   page: number,
  //   size: number,
  //   sort: string,
  //   order: string,
  //   search: string,
  // ) {
  //   const { results, totalItems } = await this.paginate(
  //     page,
  //     size,
  //     sort,
  //     order,
  //     search,
  //   );
  //   const totalPages = Math.ceil(totalItems / size) - 1;
  //   const currentPage = Number(page);

  //   return {
  //     results,
  //     pagination: {
  //       length: totalItems,
  //       size: size,
  //       lastPage: totalPages,
  //       page: currentPage,
  //       startIndex: currentPage * size,
  //       endIndex: currentPage * size + (size - 1),
  //     },
  //   };
  // }

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

    console.log('updatedUser', updatedUser);

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

    console.log('deletedUser', deletedUser);

    return deletedUser;
  }
}
