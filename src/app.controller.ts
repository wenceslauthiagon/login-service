import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { IsPublic } from './auth/decorators/is-public.decorator';
import { User } from './user/entities/user.entity';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @IsPublic()
  @Get('/check')
  getHello(): string {
    return this.appService.getCheck();
  }

  @IsPublic()
  @Get('/me')
  getMe(@CurrentUser() user: User) {
    return user;
  }
}
