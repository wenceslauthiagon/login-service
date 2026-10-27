import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { UserService } from '../../src/user/user.service';
import { UserController } from '../../src/user/user.controller';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<
    Pick<UserService, 'findById' | 'findAll' | 'create' | 'update' | 'remove'>
  >;

  let userId: string;
  let currentUser: { id: string; email: string; name: string };

  beforeEach(async () => {
    userId = uuidv4();
    currentUser = {
      id: userId,
      email: faker.internet.email(),
      name: faker.person.fullName(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findById: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  it('TC0001 - returns a user by ID regardless of who is authenticated', async () => {
    const targetUserId = uuidv4();
    const expectedUser = {
      id: targetUserId,
      name: faker.person.fullName(),
    };
    userService.findById.mockResolvedValue(expectedUser as never);

    const result = await controller.findById(targetUserId);

    expect(userService.findById).toHaveBeenCalledWith(targetUserId);
    expect(result).toEqual({
      users: {
        metadados: { domains: ['users'], api_version: '1.0' },
        data: expectedUser,
        message: 'User buscado com sucesso',
      },
    });
  });

  it('TC0002 - returns the users domain envelope with zero-based pagination', async () => {
    const expectedResult = {
      page: 0,
      pageSize: 15,
      totalPages: 1,
      totalRecords: 2,
      data: [{ id: uuidv4(), name: faker.person.fullName() }],
    };
    userService.findAll.mockResolvedValue(expectedResult as never);

    const result = await controller.findAll(0, 15);

    expect(userService.findAll).toHaveBeenCalledWith(0, 15);
    expect(result).toEqual({
      users: {
        metadados: { domains: ['users'], api_version: '1.0' },
        data: expectedResult.data,
        pagination: {
          page: expectedResult.page,
          pageSize: expectedResult.pageSize,
          totalPages: expectedResult.totalPages,
          totalRecords: expectedResult.totalRecords,
        },
        message: 'Usuários buscados com sucesso',
      },
    });
  });

  it('TC0003 - returns an empty users page for an out-of-range page index', async () => {
    const paginatedResult = {
      page: 1,
      pageSize: 1,
      totalPages: 1,
      totalRecords: 1,
      data: [],
    };
    userService.findAll.mockResolvedValue(paginatedResult as never);

    const result = await controller.findAll(1, 1);

    expect(userService.findAll).toHaveBeenCalledWith(1, 1);
    expect(result).toEqual({
      users: {
        metadados: { domains: ['users'], api_version: '1.0' },
        data: [],
        pagination: {
          page: 1,
          pageSize: 1,
          totalPages: 1,
          totalRecords: 1,
        },
        message: 'Usuários buscados com sucesso',
      },
    });
  });

  it('TC0004 - delegates user creation to the service', async () => {
    const createUserDto = {
      document: '52998224725',
      email: faker.internet.email(),
      name: faker.person.fullName(),
      password: faker.internet.password({ length: 14 }),
    };
    const expectedUser = { id: uuidv4(), name: createUserDto.name };
    userService.create.mockResolvedValue(expectedUser as never);

    const result = await controller.create(createUserDto);

    expect(userService.create).toHaveBeenCalledWith(createUserDto);
    expect(result).toEqual({
      users: {
        metadados: { domains: ['users'], api_version: '1.0' },
        data: expectedUser,
        message: 'Usuário criado com sucesso',
      },
    });
  });

  it('TC0005 - updates any user by ID for an authenticated request', async () => {
    const targetUserId = uuidv4();
    const updateDto = { name: faker.person.fullName() };
    const expectedUser = { id: targetUserId, name: updateDto.name };
    userService.update.mockResolvedValue(expectedUser as never);

    const result = await controller.update(targetUserId, updateDto);

    expect(userService.update).toHaveBeenCalledWith(targetUserId, updateDto);
    expect(result).toEqual({
      users: {
        metadados: { domains: ['users'], api_version: '1.0' },
        data: expectedUser,
        message: 'Usuário atualizado com sucesso',
      },
    });
  });

  it('TC0006 - deactivates another user by ID', async () => {
    const targetUserId = uuidv4();
    const expectedUser = { id: targetUserId, active: false };
    userService.remove.mockResolvedValue(expectedUser as never);

    const result = await controller.delete(targetUserId, currentUser);

    expect(userService.remove).toHaveBeenCalledWith(targetUserId);
    expect(result).toBeUndefined();
  });

  it('TC0007 - prevents deactivating the authenticated account', async () => {
    await expect(controller.delete(userId, currentUser)).rejects.toThrow(
      ForbiddenException,
    );
    expect(userService.remove).not.toHaveBeenCalled();
  });
});