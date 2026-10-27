import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { IsPublic } from './auth/decorators/is-public.decorator';

@ApiTags('Health Check')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @IsPublic()
  @Get('/check')
  @ApiOperation({ summary: 'Verificação de disponibilidade da API' })
  getHello(): string {
    return this.appService.getCheck();
  }

  @IsPublic()
  @Get('/health')
  @ApiOperation({ summary: 'Health check da API' })
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
