import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getCheck(): string {
    return 'Login Service';
  }

  getMe(): string {
    return 'Info extrated from JWT';
  }
}
