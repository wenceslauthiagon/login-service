import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/auth/auth.service';
import { LocalStrategy } from '../../../src/auth/strategies/local.strategy';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker/locale/pt_BR';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: jest.Mocked<Pick<AuthService, 'validateUser'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: { validateUser: jest.fn() },
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService);
  });

  it('TC0001 - validates credentials using the auth service', async () => {
    const email = faker.internet.email();
    const password = faker.internet.password({ length: 14 });
    const user = { id: uuidv4(), email };
    authService.validateUser.mockResolvedValue(user as never);

    await expect(strategy.validate(email, password)).resolves.toEqual(user);
    expect(authService.validateUser).toHaveBeenCalledWith(email, password);
  });
});