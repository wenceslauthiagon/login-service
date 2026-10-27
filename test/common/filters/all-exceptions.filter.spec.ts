import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorHandlerService } from '../../../src/common/errors/error-handler.service';
import { AllExceptionsFilter } from '../../../src/common/filters/all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let errorHandler: jest.Mocked<Pick<ErrorHandlerService, 'handle'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllExceptionsFilter,
        {
          provide: ErrorHandlerService,
          useValue: { handle: jest.fn() },
        },
      ],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
    errorHandler = module.get(ErrorHandlerService);
  });

  it('TC0001 - serializes the normalized error using the request path and method', () => {
    const exception = new Error('failure');
    const payload = { statusCode: 500, message: 'Unexpected error' };
    const response = {
      status: jest.fn(),
      json: jest.fn(),
    };
    response.status.mockReturnValue(response);
    errorHandler.handle.mockReturnValue(payload as never);
    const request = { url: '/health', method: 'GET' };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    };

    filter.catch(exception, host as never);

    expect(errorHandler.handle).toHaveBeenCalledWith(exception, '/health', 'GET');
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(payload);
  });
});