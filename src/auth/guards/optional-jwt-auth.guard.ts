import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { CurrentUserPayload } from '../decorators/current-user.decorator';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = CurrentUserPayload | null>(
    error: unknown,
    user: TUser,
  ): TUser | null {
    if (error || !user) {
      return null;
    }

    return user;
  }
}
