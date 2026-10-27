import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { LoginValidationMiddleware } from '../../../src/auth/middlewares/login-validation.middleware';

describe('LoginValidationMiddleware', () => {
  const middleware = new LoginValidationMiddleware();
  const response = {} as never;

  it('TC0001 - accepts valid login data and calls next', async () => {
    const next = jest.fn();
    const request = {
      body: {
        email: faker.internet.email(),
        password: faker.internet.password({ length: 14 }),
      },
    } as never;

    await middleware.use(request, response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - rejects invalid email and missing password', async () => {
    const next = jest.fn();
    const request = { body: { email: 'invalid-email' } } as never;

    await expect(middleware.use(request, response, next)).rejects.toThrow(
      BadRequestException,
    );
    expect(next).not.toHaveBeenCalled();
  });
});