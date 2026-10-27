import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { IsPublic } from './auth/decorators/is-public.decorator';
import { createDomainResponse } from './common/responses/domain-response';

@ApiTags('Health Check')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @IsPublic()
  @Get('/check')
  @ApiOperation({ summary: 'Verificação de disponibilidade da API' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      example: {
        health: {
          metadados: { domains: ['health'], api_version: '1.0' },
          data: { service: 'Login Service' },
          message: 'Health check successful',
        },
      },
    },
  })
  getHello() {
    return createDomainResponse(
      'health',
      { service: this.appService.getCheck() },
      'Health check successful',
    );
  }

  @IsPublic()
  @Get('/health')
  @ApiOperation({ summary: 'Health check da API' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      example: {
        health: {
          metadados: { domains: ['health'], api_version: '1.0' },
          data: { status: 'ok' },
          message: 'Health check successful',
        },
      },
    },
  })
  getHealth() {
    return createDomainResponse(
      'health',
      { status: 'ok' },
      'Health check successful',
    );
  }
}
