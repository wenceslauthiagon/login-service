import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Request,
  UseGuards,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { IsPublic } from './decorators/is-public.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthRequest } from './interfaces/auth-request.interface';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { createDomainResponse } from 'src/common/responses/domain-response';

@ApiTags('Login')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @IsPublic()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      example: {
        login: {
          metadados: { domains: ['login'], api_version: '1.0' },
          data: { access_token: 'jwt-access-token' },
          message: 'Login successful',
        },
      },
    },
  })
  login(@Request() req: AuthRequest) {
    return createDomainResponse(
      'login',
      this.authService.login(req.user),
      'Login successful',
    );
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Retornar o usuário autenticado' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      example: {
        login: {
          metadados: { domains: ['login'], api_version: '1.0' },
          data: { id: 'user-id', email: 'user@example.com', name: 'User' },
          message: 'Authenticated user retrieved successfully',
        },
      },
    },
  })
  me(@CurrentUser() user: AuthenticatedUser) {
    return createDomainResponse(
      'login',
      user,
      'Authenticated user retrieved successfully',
    );
  }

  @IsPublic()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar reset de senha' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      example: {
        login: {
          metadados: { domains: ['login'], api_version: '1.0' },
          data: null,
          message: 'If the email exists, a reset link has been sent.',
        },
      },
    },
  })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.authService.forgotPassword(body.email);
    return createDomainResponse(
      'login',
      null,
      'If the email exists, a reset link has been sent.',
    );
  }

  @IsPublic()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha usando token enviado por e-mail' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      example: {
        login: {
          metadados: { domains: ['login'], api_version: '1.0' },
          data: null,
          message: 'Password has been reset successfully.',
        },
      },
    },
  })
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body.token, body.newPassword);
    return createDomainResponse(
      'login',
      null,
      'Password has been reset successfully.',
    );
  }
}
