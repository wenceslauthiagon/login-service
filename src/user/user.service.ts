import { Injectable } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// import { User } from './entities/user.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const data: Prisma.UserCreateInput = {
      ...createUserDto,
      id: randomUUID(),
      createdAt: new Date(),
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

  async findAll() {
    return await this.prismaService.user.findMany();
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

    console.log('updatedUser', updatedUser);

    return updatedUser;
  }

  async destroy(id: string) {
    const deletedUser = await this.prismaService.user.delete({ where: { id } });
    console.log(deletedUser.id);
    return deletedUser;
  }
}
