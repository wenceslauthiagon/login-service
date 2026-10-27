import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { ErrorResponse } from '../interfaces/error-response.interface';

@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger(ErrorHandlerService.name);

  constructor(private readonly configService: ConfigService) {}

  handle(exception: unknown, path = '', method = 'UNKNOWN'): ErrorResponse {
    const normalized = this.normalize(exception);

    this.logger.error(
      `[${normalized.statusCode}] ${method} ${path} - ${normalized.message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    return {
      statusCode: normalized.statusCode,
      timestamp: new Date().toISOString(),
      path,
      message: normalized.message,
      error: normalized.error,
    };
  }

  create(
    message: string,
    statusCode: number,
    path = '',
    method = 'UNKNOWN',
  ): ErrorResponse {
    const errorName = this.getErrorName(statusCode);

    this.logger.error(`[${statusCode}] ${method} ${path} - ${message}`);

    return {
      statusCode,
      timestamp: new Date().toISOString(),
      path,
      message,
      error: errorName,
    };
  }

  private normalize(exception: unknown): {
    statusCode: number;
    message: string;
    error: string;
  } {
    const resolver = [
      {
        predicate: exception instanceof HttpException,
        handler: () => this.toHttpError(exception as HttpException),
      },
      {
        predicate: exception instanceof Prisma.PrismaClientKnownRequestError,
        handler: () =>
          this.toPrismaError(exception as Prisma.PrismaClientKnownRequestError),
      },
      {
        predicate: exception instanceof Error,
        handler: () => this.toGenericError(exception as Error),
      },
    ].find((item) => item.predicate);

    return resolver ? resolver.handler() : this.toGenericError();
  }

  private toHttpError(exception: HttpException): {
    statusCode: number;
    message: string;
    error: string;
  } {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    return {
      statusCode,
      message: this.getHttpMessage(response),
      error: this.getErrorName(statusCode),
    };
  }

  private toPrismaError(error: Prisma.PrismaClientKnownRequestError): {
    statusCode: number;
    message: string;
    error: string;
  } {
    return {
      statusCode:
        error.code === 'P2002'
          ? HttpStatus.CONFLICT
          : error.code === 'P2025'
            ? HttpStatus.NOT_FOUND
            : HttpStatus.BAD_REQUEST,
      message: this.getPrismaMessage(error),
      error: this.getConfigValue('ERROR_PRISMA_ERROR_NAME', 'PrismaError'),
    };
  }

  private toGenericError(_error?: Error): {
    statusCode: number;
    message: string;
    error: string;
  } {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: this.getConfigValue(
        'ERROR_DEFAULT_MESSAGE',
        'Unexpected error',
      ),
      error: this.getConfigValue('ERROR_INTERNAL_NAME', 'InternalServerError'),
    };
  }

  private getHttpMessage(response: unknown): string {
    if (typeof response === 'string') {
      return response;
    }

    if (response && typeof response === 'object') {
      const message = (response as { message?: unknown }).message;

      if (Array.isArray(message)) {
        return message.join(', ');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return this.getConfigValue('ERROR_DEFAULT_MESSAGE', 'Unexpected error');
  }

  private getPrismaMessage(
    error: Prisma.PrismaClientKnownRequestError,
  ): string {
    switch (error.code) {
      case 'P2002':
        return this.getConfigValue(
          'ERROR_PRISMA_UNIQUE_MESSAGE',
          'A unique constraint was violated.',
        );
      case 'P2025':
        return this.getConfigValue(
          'ERROR_PRISMA_NOT_FOUND_MESSAGE',
          'Record not found.',
        );
      default:
        return this.getConfigValue(
          'ERROR_DEFAULT_MESSAGE',
          'Unexpected error',
        );
    }
  }

  private getErrorName(statusCode: number): string {
    const map = new Map<number, string>([
      [
        HttpStatus.BAD_REQUEST,
        this.getConfigValue('ERROR_BAD_REQUEST_NAME', 'BadRequest'),
      ],
      [
        HttpStatus.UNAUTHORIZED,
        this.getConfigValue('ERROR_UNAUTHORIZED_NAME', 'Unauthorized'),
      ],
      [
        HttpStatus.FORBIDDEN,
        this.getConfigValue('ERROR_FORBIDDEN_NAME', 'Forbidden'),
      ],
      [
        HttpStatus.NOT_FOUND,
        this.getConfigValue('ERROR_NOT_FOUND_NAME', 'NotFound'),
      ],
      [
        HttpStatus.CONFLICT,
        this.getConfigValue('ERROR_CONFLICT_NAME', 'Conflict'),
      ],
    ]);

    return (
      map.get(statusCode) ??
      this.getConfigValue('ERROR_INTERNAL_NAME', 'InternalServerError')
    );
  }

  private getConfigValue(key: string, fallback: string): string {
    return this.configService.get<string>(key) ?? fallback;
  }
}
