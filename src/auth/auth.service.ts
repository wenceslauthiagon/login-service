import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AccessTokenResponse } from './interfaces/access-token-response.interface';
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  login(user: User): AccessTokenResponse {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      active: user.active,
    };

    const jwtToken = this.jwtService.sign(payload);

    return {
      access_token: jwtToken,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email.trim().toLowerCase());

    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (user.active === false || user.deleted_at) {
        throw new UnauthorizedException(
          'Email address or password provided is incorrect.',
        );
      }

      if (isPasswordValid) {
        return {
          ...user,
          password: undefined,
        };
      }
    }
    throw new UnauthorizedException(
      'Email address or password provided is incorrect.',
    );
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userService.findByEmail(normalizedEmail);

    // Always return success message to avoid leaking which emails exist
    if (!user) return true;

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const minutes =
      Number(
        this.configService.get<number>('RESET_TOKEN_EXPIRATION_MINUTES'),
      ) || 60;
    const expires = new Date(Date.now() + 1000 * 60 * minutes);

    await this.prismaService.user.update({
      where: { email: normalizedEmail },
      data: {
        reset_token: tokenHash,
        reset_token_expires: expires,
      },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
    const resetLink = frontendUrl
      ? `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${token}`
      : `?token=${token}`;

    const html = `<p>Você solicitou a recuperação de senha. Use o link abaixo para redefinir sua senha (válido por ${minutes} minutos):</p>
      <p><a href="${resetLink}">${resetLink}</a></p>`;

    try {
      await this.emailService.sendMail(user.email, 'Reset de senha', html);
    } catch (err) {
      // don't reveal email send errors to caller
    }

    return true;
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token) throw new BadRequestException('Token is required');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const user = await this.prismaService.user.findFirst({
      where: {
        reset_token: tokenHash,
        reset_token_expires: { gt: new Date() },
      },
    });

    if (!user) throw new BadRequestException('Invalid or expired token');

    const rounds =
      Number(this.configService.get<number>('BCRYPT_SALT_ROUNDS')) || 10;
    const salt = await bcrypt.genSalt(rounds);
    const hashed = await bcrypt.hash(newPassword, salt);

    await this.prismaService.user.update({
      where: { email: user.email },
      data: {
        password: hashed,
        reset_token: null,
        reset_token_expires: null,
        updated_at: new Date(),
      },
    });

    return true;
  }
}
