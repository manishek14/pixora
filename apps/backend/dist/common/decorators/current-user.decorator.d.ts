export interface CurrentUser {
    id: string;
    username: string;
    email: string;
}
export declare const CurrentUser: (...dataOrPipes: (keyof CurrentUser | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
