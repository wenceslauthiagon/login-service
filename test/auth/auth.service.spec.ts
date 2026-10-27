import { jest } from '@jest/globals';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { PrismaService } from '../../src/prisma/prisma.service';
import { EmailService } from '../../src/email/email.service';
import { UserService } from '../../src/user/user.service';
import { AuthService } from '../../src/auth/auth.service';

type MockFunction = jest.Mock<(...args: any[]) => any>;

describe('AuthService', () => {
  let service: AuthService;
  let userService: { findByEmail: MockFunction };
  let jwtService: { sign: MockFunction };
  let emailService: { sendMail: MockFunction };
  let configService: { get: MockFunction };
  let prismaService: {
    user: { update: MockFunction; findFirst: MockFunction };
  };

  beforeEach(async () => {
    userService = { findByEmail: jest.fn<(...args: any[]) => any>() };
    jwtService = { sign: jest.fn<(...args: any[]) => any>() };
    emailService = { sendMail: jest.fn<(...args: any[]) => any>() };
    configService = { get: jest.fn<(...args: any[]) => any>() };
    prismaService = {
      user: {
        update: jest.fn<(...args: any[]) => any>(),
        findFirst: jest.fn<(...args: any[]) => any>(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
        { provide: ConfigService, useValue: configService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('TC0001 - signs the expected JWT claims', () => {
    const userId = uuidv4();
    const email = faker.internet.email();
    const name = faker.person.fullName();
    const user = {
      id: userId,
      email,
      name,
      active: true,
    } as never;
    jwtService.sign.mockReturnValue('signed-jwt');

    expect(service.login(user)).toEqual({ access_token: 'signed-jwt' });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: userId,
      email,
      name,
      active: true,
    });
  });

  it('TC0002 - normalizes email and returns an active user without a password', async () => {
    const userId = uuidv4();
    const email = faker.internet.email();
    const name = faker.person.fullName();
    const passwordHash = await bcrypt.hash('secret', 4);
    userService.findByEmail.mockResolvedValue({
      id: userId,
      document: faker.string.numeric(11),
      email,
      name,
      active: true,
      created_at: faker.date.past(),
      deleted_at: null,
      updated_at: null,
      password: passwordHash,
      reset_token: null,
      reset_token_expires: null,
    });

    const result = await service.validateUser(` ${email.toUpperCase()} `, 'secret');

    expect(userService.findByEmail).toHaveBeenCalledWith(email.toLowerCase());
    expect(result).not.toHaveProperty('password', 'stored-hash');
    expect(result.password).toBeUndefined();
  });

  it('TC0003 - rejects invalid credentials', async () => {
    const email = faker.internet.email();
    userService.findByEmail.mockResolvedValue(null);

    await expect(service.validateUser(email, faker.string.alphanumeric(12))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('TC0004 - does not disclose whether an email exists during password recovery', async () => {
    const email = faker.internet.email();
    userService.findByEmail.mockResolvedValue(null);

    await expect(service.forgotPassword(email)).resolves.toBe(true);
    expect(emailService.sendMail).not.toHaveBeenCalled();
  });

  it('TC0005 - rejects an incorrect password', async () => {
    const correctPassword = faker.internet.password({ length: 14 });
    const user = {
      id: uuidv4(),
      document: faker.string.numeric(11),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      active: true,
      password: await bcrypt.hash(correctPassword, 4),
      created_at: faker.date.past(),
      deleted_at: null,
      updated_at: null,
      reset_token: null,
      reset_token_expires: null,
    };
    userService.findByEmail.mockResolvedValue(user);

    await expect(
      service.validateUser(user.email, `${correctPassword}-wrong`),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('TC0006 - rejects an inactive account', async () => {
    const password = faker.internet.password({ length: 14 });
    const user = {
      id: uuidv4(),
      document: faker.string.numeric(11),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      active: false,
      password: await bcrypt.hash(password, 4),
      created_at: faker.date.past(),
      deleted_at: null,
      updated_at: null,
      reset_token: null,
      reset_token_expires: null,
    };
    userService.findByEmail.mockResolvedValue(user);

    await expect(service.validateUser(user.email, password)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('TC0007 - stores only a hash of the reset token and sends a reset email', async () => {
    const user = {
      id: uuidv4(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
    };
    userService.findByEmail.mockResolvedValue(user as never);
    configService.get.mockImplementation((key: string) => {
      if (key === 'RESET_TOKEN_EXPIRATION_MINUTES') return 30;
      if (key === 'FRONTEND_URL') return 'https://app.example.test/';
      return undefined;
    });

    await expect(service.forgotPassword(` ${user.email.toUpperCase()} `)).resolves.toBe(
      true,
    );

    const updateCall = prismaService.user.update.mock.calls[0][0] as {
      where: { email: string };
      data: { reset_token: string; reset_token_expires: Date };
    };
    const rawToken = emailService.sendMail.mock.calls[0][2].match(
      /token=([a-f0-9]{64})/,
    )?.[1];
    expect(rawToken).toBeDefined();
    expect(updateCall.where).toEqual({ email: user.email.toLowerCase() });
    expect(updateCall.data.reset_token).toBe(
      createHash('sha256').update(rawToken as string).digest('hex'),
    );
    expect(updateCall.data.reset_token).not.toBe(rawToken);
    expect(updateCall.data.reset_token_expires).toBeInstanceOf(Date);
    expect(emailService.sendMail).toHaveBeenCalledWith(
      user.email,
      'Reset de senha',
      expect.stringContaining('30 minutos'),
    );
  });

  it('TC0008 - does not fail password recovery when SMTP delivery fails', async () => {
    const user = {
      id: uuidv4(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
    };
    userService.findByEmail.mockResolvedValue(user as never);
    prismaService.user.update.mockResolvedValue(user);
    emailService.sendMail.mockRejectedValue(new Error('SMTP unavailable'));

    await expect(service.forgotPassword(user.email)).resolves.toBe(true);
  });

  it('TC0009 - rejects an invalid or expired reset token', async () => {
    await expect(
      service.resetPassword('', faker.internet.password()),
    ).rejects.toThrow(BadRequestException);
    expect(prismaService.user.findFirst).not.toHaveBeenCalled();

    const token = faker.string.alphanumeric(64);
    prismaService.user.findFirst.mockResolvedValue(null);

    await expect(
      service.resetPassword(token, faker.internet.password()),
    ).rejects.toThrow(BadRequestException);
    expect(prismaService.user.findFirst).toHaveBeenCalledWith({
      where: {
        reset_token: createHash('sha256').update(token).digest('hex'),
        reset_token_expires: { gt: expect.any(Date) },
      },
    });
  });

  it('TC0010 - hashes a new password and consumes a valid reset token', async () => {
    const token = faker.string.alphanumeric(64);
    const user = { email: faker.internet.email() };
    prismaService.user.findFirst.mockResolvedValue(user);
    prismaService.user.update.mockResolvedValue(user);

    const newPassword = faker.internet.password({ length: 14 });
    await expect(service.resetPassword(token, newPassword)).resolves.toBe(true);

    const updateData = prismaService.user.update.mock.calls[0][0].data;
    await expect(bcrypt.compare(newPassword, updateData.password)).resolves.toBe(
      true,
    );
    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { email: user.email },
      data: {
        password: updateData.password,
        reset_token: null,
        reset_token_expires: null,
        updated_at: expect.any(Date),
      },
    });
  });
});