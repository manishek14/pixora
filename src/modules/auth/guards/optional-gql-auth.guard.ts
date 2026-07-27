import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Optional JWT guard — behaves like GqlAuthGuard, but does NOT reject the
 * request if no token is present (or the token is invalid). Instead, it
 * sets `req.user` to the validated user if a valid token was supplied,
 * and leaves it undefined otherwise.
 *
 * Used by public endpoints that want to optionally personalize the response
 * when a viewer is logged in (e.g. Search, Explore) without requiring auth.
 */
@Injectable()
export class OptionalGqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(_err: any, user: any) {
    // No error if user is missing — just return undefined so the resolver
    // can decide how to behave.
    return user || undefined;
  }
}
