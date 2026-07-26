"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const register_input_1 = require("./dto/register.input");
const login_input_1 = require("./dto/login.input");
const refresh_input_1 = require("./dto/refresh.input");
const auth_payload_1 = require("./dto/auth-payload");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const gql_auth_guard_1 = require("./guards/gql-auth.guard");
const user_entity_1 = require("../users/user.entity");
let AuthResolver = class AuthResolver {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    async register(input) {
        return this.auth.register(input);
    }
    async login(input) {
        return this.auth.login(input);
    }
    async refresh(input) {
        return this.auth.refresh(input.refreshToken);
    }
    async logout(user) {
        return this.auth.logout(user.id);
    }
    async me(user) {
        return user;
    }
};
exports.AuthResolver = AuthResolver;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, graphql_1.Mutation)(() => auth_payload_1.AuthPayload, { description: 'ثبت‌نام کاربر جدید' }),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_input_1.RegisterInput]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, graphql_1.Mutation)(() => auth_payload_1.AuthPayload, { description: 'ورود کاربر' }),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_input_1.LoginInput]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, graphql_1.Mutation)(() => auth_payload_1.AuthPayload, { description: 'تمدید توکن با refresh token' }),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_input_1.RefreshTokenInput]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "refresh", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean, { description: 'خروج و ابطال refresh token' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "logout", null);
__decorate([
    (0, graphql_1.Query)(() => user_entity_1.UserEntity, { description: 'کاربر فعلی' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity]),
    __metadata("design:returntype", Promise)
], AuthResolver.prototype, "me", null);
exports.AuthResolver = AuthResolver = __decorate([
    (0, graphql_1.Resolver)(() => auth_payload_1.AuthPayload),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthResolver);
//# sourceMappingURL=auth.resolver.js.map