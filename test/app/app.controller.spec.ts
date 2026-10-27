import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../../src/app.controller';
import { AppService } from '../../src/app.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('TC0001 - serves the legacy check route', () => {
    expect(controller.getHello()).toEqual({
      health: {
        metadados: { domains: ['health'], api_version: '1.0' },
        data: { service: 'Login Service' },
        message: 'Health check successful',
      },
    });
  });

  it('TC0002 - returns the API health status', () => {
    expect(controller.getHealth()).toEqual({
      health: {
        metadados: { domains: ['health'], api_version: '1.0' },
        data: { status: 'ok' },
        message: 'Health check successful',
      },
    });
  });
});