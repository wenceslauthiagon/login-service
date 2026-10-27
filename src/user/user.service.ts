import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { randomUUID } from 'crypto';
import PaginatedResult from './helpers/paginated-result.helper';
import { DocumentFactory } from './documents/document.factory';
import { UserListItem } from './interfaces/user-list-item.interface';
import { UserResponse } from './interfaces/user-response.interface';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private sanitizeUserForResponse(user: User): UserResponse {
    const {
      password: _password,
      reset_token: _resetToken,
      reset_token_expires: _resetTokenExpires,
      ...safeUser
    } = user;

    return safeUser;
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    const docValidator = DocumentFactory.getValidator(createUserDto.document);
    const normalizedDocument = docValidator.normalize(createUserDto.document);

    if (!docValidator.validate(normalizedDocument)) {
      throw new BadRequestException('Document is invalid');
    }

    const normalizedEmail = (createUserDto.email || '').trim().toLowerCase();

    const exists = await this.prismaService.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { document: normalizedDocument }],
      },
    });

    if (exists) {
      throw new ConflictException('Email or document already in use');
    }

    const rounds =
      Number(this.configService.get<number>('BCRYPT_SALT_ROUNDS')) || 10;
    const salt = await bcrypt.genSalt(rounds);
    const hashed = await bcrypt.hash(createUserDto.password, salt);

    const data: Prisma.UserCreateInput = {
      id: randomUUID(),
      email: normalizedEmail,
      document: normalizedDocument,
      name: createUserDto.name,
      active: true,
      created_at: new Date(),
      password: hashed,
    };

    const createdUser = await this.prismaService.user.create({ data });

    return this.sanitizeUserForResponse(createdUser);
  }

  async findAll(
    page = 1,
    limitPerpage = 10,
  ): Promise<PaginatedResult<UserListItem[]>> {
    const numberEntries = await this.prismaService.user.count({
      where: { active: true },
    });
    const paginatedResult = new PaginatedResult<UserListItem[]>(
      page,
      numberEntries,
      limitPerpage,
    );

    const data = await this.prismaService.user.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
        active: true,
        created_at: true,
      },
      skip: paginatedResult.offset,
      take: paginatedResult.limitPerpage,
      orderBy: {
        id: 'asc',
      },
    });

    paginatedResult.data = data;

    return paginatedResult;
  }

  async findByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    const userExist = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!userExist) {
      throw new NotFoundException('User does not exist');
    }

    const data: Prisma.UserUpdateInput = {
      name: updateUserDto.name,
      updated_at: new Date(),
    };

    const updatedUser = await this.prismaService.user.update({
      data,
      where: {
        id,
      },
    });

    return this.sanitizeUserForResponse(updatedUser);
  }

  async remove(id: string): Promise<UserResponse> {
    const userExist = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!userExist) {
      throw new NotFoundException('User does not exist');
    }

    const data: Prisma.UserUpdateInput = {
      deleted_at: new Date(),
      active: false,
    };

    const deletedUser = await this.prismaService.user.update({
      data,
      where: {
        id,
      },
    });

    return this.sanitizeUserForResponse(deletedUser);
  }
}
