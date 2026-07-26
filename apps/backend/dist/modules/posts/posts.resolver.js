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
exports.PostsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const post_entity_1 = require("./post.entity");
const posts_service_1 = require("./posts.service");
const create_post_input_1 = require("./dto/create-post.input");
const update_post_input_1 = require("./dto/update-post.input");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const gql_auth_guard_1 = require("../auth/guards/gql-auth.guard");
const user_entity_1 = require("../users/user.entity");
let PostsResolver = class PostsResolver {
    posts;
    constructor(posts) {
        this.posts = posts;
    }
    async post(id) {
        return this.posts.findById(id);
    }
    async postsByUser(userId, limit, offset) {
        return this.posts.findByAuthor(userId, limit, offset);
    }
    async postsByHashtag(tag, limit, offset) {
        return this.posts.findByHashtag(tag, limit, offset);
    }
    async createPost(user, input) {
        return this.posts.create(user.id, input);
    }
    async updatePost(user, id, input) {
        return this.posts.update(id, user.id, input);
    }
    async deletePost(user, id) {
        return this.posts.delete(id, user.id);
    }
    async toggleArchive(user, id, archive) {
        return this.posts.archive(id, user.id, archive);
    }
};
exports.PostsResolver = PostsResolver;
__decorate([
    (0, graphql_1.Query)(() => post_entity_1.PostEntity, { description: 'دریافت یک پست با شناسه' }),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostsResolver.prototype, "post", null);
__decorate([
    (0, graphql_1.Query)(() => [post_entity_1.PostEntity], { description: 'پست‌های یک کاربر' }),
    __param(0, (0, graphql_1.Args)('userId')),
    __param(1, (0, graphql_1.Args)('limit', { nullable: true, defaultValue: 20 })),
    __param(2, (0, graphql_1.Args)('offset', { nullable: true, defaultValue: 0 })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], PostsResolver.prototype, "postsByUser", null);
__decorate([
    (0, graphql_1.Query)(() => [post_entity_1.PostEntity], { description: 'پست‌های یک هشتگ' }),
    __param(0, (0, graphql_1.Args)('tag')),
    __param(1, (0, graphql_1.Args)('limit', { nullable: true, defaultValue: 20 })),
    __param(2, (0, graphql_1.Args)('offset', { nullable: true, defaultValue: 0 })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], PostsResolver.prototype, "postsByHashtag", null);
__decorate([
    (0, graphql_1.Mutation)(() => post_entity_1.PostEntity, { description: 'ساخت پست جدید' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity,
        create_post_input_1.CreatePostInput]),
    __metadata("design:returntype", Promise)
], PostsResolver.prototype, "createPost", null);
__decorate([
    (0, graphql_1.Mutation)(() => post_entity_1.PostEntity, { description: 'ویرایش پست' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('id')),
    __param(2, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity, String, update_post_input_1.UpdatePostInput]),
    __metadata("design:returntype", Promise)
], PostsResolver.prototype, "updatePost", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean, { description: 'حذف پست' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity, String]),
    __metadata("design:returntype", Promise)
], PostsResolver.prototype, "deletePost", null);
__decorate([
    (0, graphql_1.Mutation)(() => post_entity_1.PostEntity, { description: 'آرشیو/بازگردانی پست' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('id')),
    __param(2, (0, graphql_1.Args)('archive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity, String, Boolean]),
    __metadata("design:returntype", Promise)
], PostsResolver.prototype, "toggleArchive", null);
exports.PostsResolver = PostsResolver = __decorate([
    (0, graphql_1.Resolver)(() => post_entity_1.PostEntity),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], PostsResolver);
//# sourceMappingURL=posts.resolver.js.map