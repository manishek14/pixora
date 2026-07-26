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
exports.CommentsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const comment_entity_1 = require("./comment.entity");
const comments_service_1 = require("./comments.service");
const create_comment_input_1 = require("./dto/create-comment.input");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const gql_auth_guard_1 = require("../auth/guards/gql-auth.guard");
const user_entity_1 = require("../users/user.entity");
let CommentsResolver = class CommentsResolver {
    commentsService;
    constructor(commentsService) {
        this.commentsService = commentsService;
    }
    async comments(postId) {
        return this.commentsService.findByPost(postId);
    }
    async createComment(user, input) {
        return this.commentsService.create(user.id, input);
    }
    async updateComment(user, id, text) {
        return this.commentsService.update(id, user.id, text);
    }
    async deleteComment(user, id) {
        return this.commentsService.delete(id, user.id);
    }
};
exports.CommentsResolver = CommentsResolver;
__decorate([
    (0, graphql_1.Query)(() => [comment_entity_1.CommentEntity], { description: 'کامنت‌های یک پست با پاسخ‌ها' }),
    __param(0, (0, graphql_1.Args)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommentsResolver.prototype, "comments", null);
__decorate([
    (0, graphql_1.Mutation)(() => comment_entity_1.CommentEntity, { description: 'ثبت کامنت یا پاسخ' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity,
        create_comment_input_1.CreateCommentInput]),
    __metadata("design:returntype", Promise)
], CommentsResolver.prototype, "createComment", null);
__decorate([
    (0, graphql_1.Mutation)(() => comment_entity_1.CommentEntity, { description: 'ویرایش کامنت' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('id')),
    __param(2, (0, graphql_1.Args)('text')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity, String, String]),
    __metadata("design:returntype", Promise)
], CommentsResolver.prototype, "updateComment", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean, { description: 'حذف کامنت' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity, String]),
    __metadata("design:returntype", Promise)
], CommentsResolver.prototype, "deleteComment", null);
exports.CommentsResolver = CommentsResolver = __decorate([
    (0, graphql_1.Resolver)(() => comment_entity_1.CommentEntity),
    __metadata("design:paramtypes", [comments_service_1.CommentsService])
], CommentsResolver);
//# sourceMappingURL=comments.resolver.js.map