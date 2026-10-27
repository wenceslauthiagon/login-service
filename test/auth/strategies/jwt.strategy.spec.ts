import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { JwtStrategy } from '../../../src/auth/strategies/jwt.strategy';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker/locale/pt_BR';

type MockFunction = jest.Mock<(...args: any[]) => any>;

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: { user: { findUnique: MockFunction } };

  beforeEach(async () => {
    prismaService = {
      user: { findUnique: jest.fn<(...args: any[]) => any>() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-secret') } },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('TC0001 - returns current user data for an active account', async () => {
    const user = {
      id: uuidv4(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      active: true,
      deleted_at: null,
    };
    prismaService.user.findUnique.mockResolvedValue(user);

    await expect(
      strategy.validate({
        sub: user.id,
        email: faker.internet.email(),
        name: faker.person.fullName(),
        active: true,
      }),
    ).resolves.toEqual({ id: user.id, email: user.email, name: user.name });
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        deleted_at: true,
      },
    });
  });

  it('TC0002 - rejects missing, inactive, or deleted accounts', async () => {
    const subject = uuidv4();
    const payload = {
      sub: subject,
      email: faker.internet.email(),
      name: faker.person.fullName(),
      active: true,
    };

    prismaService.user.findUnique.mockResolvedValue(null);
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );

    prismaService.user.findUnique.mockResolvedValue({
      id: subject,
      email: payload.email,
      name: payload.name,
      active: false,
      deleted_at: null,
    });
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );

    prismaService.user.findUnique.mockResolvedValue({
      id: subject,
      email: payload.email,
      name: payload.name,
      active: true,
      deleted_at: new Date(),
    });
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});