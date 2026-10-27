import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { AuthService } from '../../src/auth/auth.service';
import { AuthController } from '../../src/auth/auth.controller';
import { LocalAuthGuard } from '../../src/auth/guards/local-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<
    Pick<AuthService, 'login' | 'forgotPassword' | 'resetPassword'>
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('TC0001 - returns a token for the authenticated local user', () => {
    const user = { id: uuidv4() } as never;
    const token = { access_token: faker.string.alphanumeric(48) };
    authService.login.mockReturnValue(token);

    const result = controller.login({ user } as never);

    expect(authService.login).toHaveBeenCalledWith(user);
    expect(result).toEqual({
      login: {
        metadados: { domains: ['login'], api_version: '1.0' },
        data: token,
        message: 'Login successful',
      },
    });
  });

  it('TC0002 - requests password recovery for the supplied email', async () => {
    const email = faker.internet.email();
    authService.forgotPassword.mockResolvedValue(true);

    const result = await controller.forgotPassword({
      email,
    });

    expect(authService.forgotPassword).toHaveBeenCalledWith(email);
    expect(result).toEqual({
      login: {
        metadados: { domains: ['login'], api_version: '1.0' },
        data: null,
        message: 'If the email exists, a reset link has been sent.',
      },
    });
  });

  it('TC0003 - delegates password reset and returns a success message', async () => {
    const token = faker.string.alphanumeric(64);
    const newPassword = faker.internet.password({ length: 14 });
    authService.resetPassword.mockResolvedValue(true);

    const result = await controller.resetPassword({
      token,
      newPassword,
    });

    expect(authService.resetPassword).toHaveBeenCalledWith(token, newPassword);
    expect(result).toEqual({
      login: {
        metadados: { domains: ['login'], api_version: '1.0' },
        data: null,
        message: 'Password has been reset successfully.',
      },
    });
  });

  it('TC0004 - returns the authenticated user profile', () => {
    const user = {
      id: uuidv4(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
    };

    expect(controller.me(user)).toEqual({
      login: {
        metadados: { domains: ['login'], api_version: '1.0' },
        data: user,
        message: 'Authenticated user retrieved successfully',
      },
    });
  });
});