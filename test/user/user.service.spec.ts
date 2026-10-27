import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UserService } from '../../src/user/user.service';

type MockFunction = jest.Mock<(...args: any[]) => any>;

describe('UserService', () => {
  let service: UserService;
  let prismaService: {
    user: {
      findUnique: MockFunction;
      findMany: MockFunction;
      count: MockFunction;
      findFirst: MockFunction;
      create: MockFunction;
      update: MockFunction;
    };
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn<(...args: any[]) => any>(),
        findMany: jest.fn<(...args: any[]) => any>(),
        count: jest.fn<(...args: any[]) => any>(),
        findFirst: jest.fn<(...args: any[]) => any>(),
        create: jest.fn<(...args: any[]) => any>(),
        update: jest.fn<(...args: any[]) => any>(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prismaService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('TC0001 - finds an active user without returning credentials', async () => {
    const userId = uuidv4();
    const email = faker.internet.email();
    const name = faker.person.fullName();
    prismaService.user.findUnique.mockResolvedValue({
      id: userId,
      document: '52998224725',
      email,
      name,
      active: true,
      password: 'stored-hash',
      reset_token: 'hashed-reset-token',
      reset_token_expires: new Date(),
      created_at: new Date(),
      deleted_at: null,
      updated_at: null,
    });

    const result = await service.findById(userId);

    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
    });
    expect(result).toMatchObject({ id: userId, email, name });
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('reset_token');
    expect(result).not.toHaveProperty('reset_token_expires');
  });

  it('TC0002 - throws not found for a missing, inactive, or deleted user', async () => {
    const missingUserId = uuidv4();
    prismaService.user.findUnique.mockResolvedValue(null);
    await expect(service.findById(missingUserId)).rejects.toThrow(
      NotFoundException,
    );

    const inactiveUserId = uuidv4();
    prismaService.user.findUnique.mockResolvedValue({
      id: inactiveUserId,
      active: false,
      deleted_at: null,
    });
    await expect(service.findById(inactiveUserId)).rejects.toThrow(
      NotFoundException,
    );

    const deletedUserId = uuidv4();
    prismaService.user.findUnique.mockResolvedValue({
      id: deletedUserId,
      active: true,
      deleted_at: faker.date.past(),
    });
    await expect(service.findById(deletedUserId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('TC0003 - lists active users and counts the same filtered set', async () => {
    const userId = uuidv4();
    const users = [
      {
        id: userId,
        document: faker.string.numeric(9),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        active: true,
        created_at: faker.date.past(),
        deleted_at: null,
        updated_at: faker.date.recent(),
      },
    ];
    prismaService.user.count.mockResolvedValue(1);
    prismaService.user.findMany.mockResolvedValue(users);

    const result = await service.findAll(1, 10);

    expect(result.data).toEqual(users);
    expect(prismaService.user.count).toHaveBeenCalledWith({
      where: { active: true },
    });
    expect(prismaService.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { active: true },
        select: {
          id: true,
          document: true,
          email: true,
          name: true,
          active: true,
          created_at: true,
          deleted_at: true,
          updated_at: true,
        },
      }),
    );
  });

  it('TC0004 - returns an empty page when the requested zero-based page is past the end', async () => {
    prismaService.user.count.mockResolvedValue(1);
    prismaService.user.findMany.mockResolvedValue([]);

    const result = await service.findAll(1, 1);

    expect(result.page).toBe(1);
    expect(result.offset).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.totalRecords).toBe(1);
    expect(result.data).toEqual([]);
    expect(prismaService.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 1, take: 1 }),
    );
  });

  it('TC0005 - creates a user with normalized fields and a hashed password', async () => {
    const email = faker.internet.email();
    const name = faker.person.fullName();
    const password = faker.internet.password({ length: 14 });
    const createdAt = faker.date.recent();

    prismaService.user.findFirst.mockResolvedValue(null);
    prismaService.user.create.mockImplementation(async ({ data }) => ({
      ...data,
      created_at: createdAt,
      deleted_at: null,
      updated_at: null,
      reset_token: null,
      reset_token_expires: null,
    }));

    const result = await service.create({
      document: '529.982.247-25',
      email: ` ${email.toUpperCase()} `,
      name,
      password,
    });

    expect(prismaService.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { document: '52998224725' },
        ],
      },
    });
    expect(prismaService.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: email.toLowerCase(),
        document: '52998224725',
        name,
        active: true,
      }),
    });
    const savedPassword = prismaService.user.create.mock.calls[0][0].data.password;
    await expect(bcrypt.compare(password, savedPassword)).resolves.toBe(true);
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('reset_token');
  });

  it('TC0006 - rejects an invalid document before querying the database', async () => {
    await expect(
      service.create({
        document: '11111111111',
        email: faker.internet.email(),
        name: faker.person.fullName(),
        password: faker.internet.password({ length: 14 }),
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prismaService.user.findFirst).not.toHaveBeenCalled();
  });

  it('TC0007 - rejects duplicate email or document', async () => {
    prismaService.user.findFirst.mockResolvedValue({ id: uuidv4() });

    await expect(
      service.create({
        document: '52998224725',
        email: faker.internet.email(),
        name: faker.person.fullName(),
        password: faker.internet.password({ length: 14 }),
      }),
    ).rejects.toThrow(ConflictException);
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });

  it('TC0008 - finds a user by email', async () => {
    const email = faker.internet.email();
    const user = { id: uuidv4(), email };
    prismaService.user.findUnique.mockResolvedValue(user);

    await expect(service.findByEmail(email)).resolves.toBe(user);
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { email },
    });
  });

  it('TC0009 - updates the user name and removes credentials from the result', async () => {
    const userId = uuidv4();
    const user = {
      id: userId,
      document: '52998224725',
      email: faker.internet.email(),
      name: faker.person.fullName(),
      active: true,
      password: faker.string.alphanumeric(60),
      created_at: faker.date.past(),
      deleted_at: null,
      updated_at: null,
      reset_token: faker.string.alphanumeric(64),
      reset_token_expires: faker.date.future(),
    };
    const updatedUser = { ...user, name: faker.person.fullName() };
    prismaService.user.findUnique.mockResolvedValue(user);
    prismaService.user.update.mockResolvedValue(updatedUser);

    const result = await service.update(userId, { name: updatedUser.name });

    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { name: updatedUser.name, updated_at: expect.any(Date) },
    });
    expect(result.name).toBe(updatedUser.name);
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('reset_token');
  });

  it('TC0010 - rejects updates for a missing user', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      service.update(uuidv4(), { name: faker.person.fullName() }),
    ).rejects.toThrow(NotFoundException);
    expect(prismaService.user.update).not.toHaveBeenCalled();
  });

  it('TC0011 - removes a user by deactivating it and setting deleted_at', async () => {
    const userId = uuidv4();
    const user = {
      id: userId,
      document: '52998224725',
      email: faker.internet.email(),
      name: faker.person.fullName(),
      active: true,
      password: faker.string.alphanumeric(60),
      created_at: faker.date.past(),
      deleted_at: null,
      updated_at: null,
      reset_token: null,
      reset_token_expires: null,
    };
    const removedUser = { ...user, active: false, deleted_at: new Date() };
    prismaService.user.findUnique.mockResolvedValue(user);
    prismaService.user.update.mockResolvedValue(removedUser);

    const result = await service.remove(userId);

    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { active: false, deleted_at: expect.any(Date) },
    });
    expect(result.active).toBe(false);
    expect(result).not.toHaveProperty('password');
  });

  it('TC0012 - rejects removing a missing user', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(service.remove(uuidv4())).rejects.toThrow(NotFoundException);
    expect(prismaService.user.update).not.toHaveBeenCalled();
  });
});