import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const data = {
      ...createUserDto,
      id: randomUUID(),
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

  async update(email: string, data: UpdateUserDto) {
    const userExist = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!userExist) {
      throw new Error('User does not exist...');
    }

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

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
