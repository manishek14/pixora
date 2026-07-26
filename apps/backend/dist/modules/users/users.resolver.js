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
exports.UsersResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const user_entity_1 = require("./user.entity");
const users_service_1 = require("./users.service");
const update_profile_input_1 = require("./dto/update-profile.input");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const gql_auth_guard_1 = require("../auth/guards/gql-auth.guard");
let UsersResolver = class UsersResolver {
    users;
    constructor(users) {
        this.users = users;
    }
    async user(id) {
        return this.users.findById(id);
    }
    async userByUsername(username) {
        return this.users.findByUsername(username);
    }
    async searchUsers(q, limit) {
        return this.users.search(q, limit);
    }
    async updateProfile(user, input) {
        return this.users.updateProfile(user.id, input);
    }
    async updateAvatar(user, url) {
        return this.users.updateAvatar(user.id, url);
    }
};
exports.UsersResolver = UsersResolver;
__decorate([
    (0, graphql_1.Query)(() => user_entity_1.UserEntity, { description: 'دریافت کاربر با شناسه' }),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersResolver.prototype, "user", null);
__decorate([
    (0, graphql_1.Query)(() => user_entity_1.UserEntity, { description: 'دریافت کاربر با نام کاربری' }),
    __param(0, (0, graphql_1.Args)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersResolver.prototype, "userByUsername", null);
__decorate([
    (0, graphql_1.Query)(() => [user_entity_1.UserEntity], { description: 'جستجوی کاربران' }),
    __param(0, (0, graphql_1.Args)('q')),
    __param(1, (0, graphql_1.Args)('limit', { nullable: true, defaultValue: 20 })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], UsersResolver.prototype, "searchUsers", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_entity_1.UserEntity, { description: 'بروزرسانی پروفایل' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity,
        update_profile_input_1.UpdateProfileInput]),
    __metadata("design:returntype", Promise)
], UsersResolver.prototype, "updateProfile", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_entity_1.UserEntity, { description: 'بروزرسانی آواتار' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity, String]),
    __metadata("design:returntype", Promise)
], UsersResolver.prototype, "updateAvatar", null);
exports.UsersResolver = UsersResolver = __decorate([
    (0, graphql_1.Resolver)(() => user_entity_1.UserEntity),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersResolver);
//# sourceMappingURL=users.resolver.js.map