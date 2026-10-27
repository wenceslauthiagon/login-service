import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { afterEach } from '@jest/globals';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('TC0001 - returns the health response envelope', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({
        health: {
          metadados: {
            domains: ['health'],
            api_version: '1.0',
          },
          data: { status: 'ok' },
          message: 'Health check successful',
        },
      });
  });
});
