import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUser | undefined, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    const user = req?.user as CurrentUser | undefined;
    return data ? user?.[data] : user;
  },
);
