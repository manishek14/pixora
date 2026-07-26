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
exports.FollowsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const follows_service_1 = require("./follows.service");
const user_entity_1 = require("../users/user.entity");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const gql_auth_guard_1 = require("../auth/guards/gql-auth.guard");
let FollowsResolver = class FollowsResolver {
    followsService;
    constructor(followsService) {
        this.followsService = followsService;
    }
    async followUser(user, targetId) {
        await this.followsService.follow(user.id, targetId);
        return true;
    }
    async unfollowUser(user, targetId) {
        return this.followsService.unfollow(user.id, targetId);
    }
    async removeFollower(user, followerId) {
        return this.followsService.removeFollower(user.id, followerId);
    }
    async isFollowing(user, targetId) {
        return this.followsService.isFollowing(user.id, targetId);
    }
    async followers(userId) {
        return this.followsService.getFollowers(userId);
    }
    async following(userId) {
        return this.followsService.getFollowing(userId);
    }
    async toggleCloseFriend(user, targetId, isClose) {
        await this.followsService.toggleCloseFriend(user.id, targetId, isClose);
        return true;
    }
    async myCloseFriends(user) {
        return this.followsService.getCloseFriends(user.id);
    }
};
exports.FollowsResolver = FollowsResolver;
__decorate([
    (0, graphql_1.Mutation)(() => Boolean, { description: 'فالو کردن کاربر' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity, String]),
    __metadata("design:returntype", Promise)
], FollowsResolver.prototype, "followUser", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean, { description: 'آنفالو کردن کاربر' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity, String]),
    __metadata("design:returntype", Promise)
], FollowsResolver.prototype, "unfollowUser", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean, { description: 'حذف فالوور از لیست خود' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('followerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity, String]),
    __metadata("design:returntype", Promise)
], FollowsResolver.prototype, "removeFollower", null);
__decorate([
    (0, graphql_1.Query)(() => Boolean, { description: 'آیا فالو می‌کند؟' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity, String]),
    __metadata("design:returntype", Promise)
], FollowsResolver.prototype, "isFollowing", null);
__decorate([
    (0, graphql_1.Query)(() => [user_entity_1.UserEntity], { description: 'لیست فالوورها' }),
    __param(0, (0, graphql_1.Args)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FollowsResolver.prototype, "followers", null);
__decorate([
    (0, graphql_1.Query)(() => [user_entity_1.UserEntity], { description: 'لیست فالووینگ‌ها' }),
    __param(0, (0, graphql_1.Args)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FollowsResolver.prototype, "following", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean, { description: 'افزودن/حذف به کلوزفرندز' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('userId')),
    __param(2, (0, graphql_1.Args)('isClose')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity, String, Boolean]),
    __metadata("design:returntype", Promise)
], FollowsResolver.prototype, "toggleCloseFriend", null);
__decorate([
    (0, graphql_1.Query)(() => [user_entity_1.UserEntity], { description: 'کلوزفرندز من' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity]),
    __metadata("design:returntype", Promise)
], FollowsResolver.prototype, "myCloseFriends", null);
exports.FollowsResolver = FollowsResolver = __decorate([
    (0, graphql_1.Resolver)(() => user_entity_1.UserEntity),
    __metadata("design:paramtypes", [follows_service_1.FollowsService])
], FollowsResolver);
//# sourceMappingURL=follows.resolver.js.map