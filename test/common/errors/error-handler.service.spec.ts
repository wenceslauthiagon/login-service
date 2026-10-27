import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { ErrorHandlerService } from '../../../src/common/errors/error-handler.service';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let configService: { get: jest.Mock<(...args: any[]) => any> };

  beforeEach(async () => {
    configService = { get: jest.fn<(...args: any[]) => any>() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErrorHandlerService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<ErrorHandlerService>(ErrorHandlerService);
    jest.spyOn((service as any).logger, 'error').mockImplementation(() => {});
  });

  it('TC0001 - preserves an HTTP status and formats validation messages', () => {
    const error = new HttpException(
      { message: ['email is invalid', 'password is required'] },
      HttpStatus.BAD_REQUEST,
    );

    expect(service.handle(error, '/users', 'POST')).toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      path: '/users',
      message: 'email is invalid, password is required',
      error: 'BadRequest',
    });
  });

  it('TC0002 - maps unique constraint errors to conflict without exposing database detail', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      faker.lorem.sentence(),
      {
        code: 'P2002',
        clientVersion: 'test',
      },
    );

    expect(service.handle(error).statusCode).toBe(HttpStatus.CONFLICT);
    expect(service.handle(error).message).toBe(
      'A unique constraint was violated.',
    );
  });

  it('TC0003 - hides internal error messages from API responses', () => {
    const response = service.handle(new Error(faker.string.alphanumeric(32)));

    expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.message).toBe('Unexpected error');
    expect(response.error).toBe('InternalServerError');
  });

  it('TC0004 - uses configured public messages when available', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'ERROR_DEFAULT_MESSAGE') return 'Request failed';
      if (key === 'ERROR_INTERNAL_NAME') return 'ServerFailure';
      return undefined;
    });

    const response = service.handle(new Error(faker.string.alphanumeric(24)));

    expect(response.message).toBe('Request failed');
    expect(response.error).toBe('ServerFailure');
  });

  it('TC0005 - normalizes HTTP string and object responses with fallback messages', () => {
    const stringResponse = service.handle(
      new HttpException('Request rejected', HttpStatus.FORBIDDEN),
    );
    const objectResponse = service.handle(
      new HttpException({ message: 'Resource missing' }, HttpStatus.NOT_FOUND),
    );
    const emptyResponse = service.handle(
      new HttpException({}, HttpStatus.UNAUTHORIZED),
    );

    expect(stringResponse).toMatchObject({
      statusCode: HttpStatus.FORBIDDEN,
      message: 'Request rejected',
      error: 'Forbidden',
    });
    expect(objectResponse).toMatchObject({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Resource missing',
      error: 'NotFound',
    });
    expect(emptyResponse).toMatchObject({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'Unexpected error',
      error: 'Unauthorized',
    });
  });

  it('TC0006 - maps Prisma not-found and unknown errors to safe messages', () => {
    const notFoundError = new Prisma.PrismaClientKnownRequestError(
      faker.lorem.sentence(),
      { code: 'P2025', clientVersion: 'test' },
    );
    const unknownError = new Prisma.PrismaClientKnownRequestError(
      faker.lorem.sentence(),
      { code: 'P2000', clientVersion: 'test' },
    );

    expect(service.handle(notFoundError)).toMatchObject({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Record not found.',
    });
    expect(service.handle(unknownError)).toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Unexpected error',
    });
  });

  it('TC0007 - creates an error response and maps its HTTP status name', () => {
    const response = service.create(
      'Duplicate account',
      HttpStatus.CONFLICT,
      '/users',
      'POST',
    );

    expect(response).toMatchObject({
      statusCode: HttpStatus.CONFLICT,
      path: '/users',
      message: 'Duplicate account',
      error: 'Conflict',
    });
    expect(response.timestamp).toEqual(expect.any(String));
  });
});