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
exports.LikesResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const like_entity_1 = require("./like.entity");
const likes_service_1 = require("./likes.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const gql_auth_guard_1 = require("../auth/guards/gql-auth.guard");
const user_entity_1 = require("../users/user.entity");
let LikesResolver = class LikesResolver {
    likes;
    constructor(likes) {
        this.likes = likes;
    }
    async toggleLike(user, postId) {
        return this.likes.toggle(user.id, postId);
    }
    async isLiked(user, postId) {
        return this.likes.isLiked(user.id, postId);
    }
    async likers(postId) {
        return this.likes.getLikers(postId);
    }
};
exports.LikesResolver = LikesResolver;
__decorate([
    (0, graphql_1.Mutation)(() => Boolean, {
        description: 'لایک/آنلایک پست (toggle). true = لایک شد، false = آنلایک شد',
    }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity, String]),
    __metadata("design:returntype", Promise)
], LikesResolver.prototype, "toggleLike", null);
__decorate([
    (0, graphql_1.Query)(() => Boolean, { description: 'آیا کاربر پست را لایک کرده؟' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity, String]),
    __metadata("design:returntype", Promise)
], LikesResolver.prototype, "isLiked", null);
__decorate([
    (0, graphql_1.Query)(() => [like_entity_1.LikeEntity], { description: 'لیست لایک‌کنندگان پست' }),
    __param(0, (0, graphql_1.Args)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LikesResolver.prototype, "likers", null);
exports.LikesResolver = LikesResolver = __decorate([
    (0, graphql_1.Resolver)(() => like_entity_1.LikeEntity),
    __metadata("design:paramtypes", [likes_service_1.LikesService])
], LikesResolver);
//# sourceMappingURL=likes.resolver.js.map