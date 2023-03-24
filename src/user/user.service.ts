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
    return await this.prismaService.user.findMany({
      where: { email },
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
