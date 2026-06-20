import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export type CurrentUserPayload = {
  id: string;
  email: string | null;
  role: string;
};

type RequestWithUser = Request & {
  user?: CurrentUserPayload;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserPayload | null => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    return request.user ?? null;
  },
);
