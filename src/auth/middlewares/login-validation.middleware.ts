import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class LoginValidationMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const loginDto = Object.assign(new LoginDto(), req.body ?? {});
    const validationErrors = await validate(loginDto);

    if (validationErrors.length > 0) {
      const messages = validationErrors.flatMap((error) =>
        Object.values(error.constraints ?? {}),
      );

      throw new BadRequestException(messages);
    }

    next();
  }
}