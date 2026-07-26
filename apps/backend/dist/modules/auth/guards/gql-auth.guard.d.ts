import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
declare const GqlAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class GqlAuthGuard extends GqlAuthGuard_base {
    private reflector;
    constructor(reflector: Reflector);
    getRequest(context: ExecutionContext): any;
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | import("rxjs").Observable<boolean>;
    handleRequest(err: any, user: any, info: any): any;
}
export {};
