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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
const post_entity_1 = require("../posts/post.entity");
const like_entity_1 = require("../likes/like.entity");
const comment_entity_1 = require("../comments/comment.entity");
const follow_entity_1 = require("../follows/follow.entity");
let UserEntity = class UserEntity {
    id;
    username;
    email;
    password;
    refreshToken;
    fullName;
    bio;
    avatarUrl;
    website;
    isPrivate;
    isVerified;
    createdAt;
    updatedAt;
    posts;
    likes;
    comments;
    following;
    followers;
};
exports.UserEntity = UserEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], UserEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 50 }),
    (0, typeorm_1.Index)(),
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], UserEntity.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 255 }),
    (0, typeorm_1.Index)(),
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], UserEntity.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ select: false }),
    __metadata("design:type", String)
], UserEntity.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, select: false }),
    __metadata("design:type", String)
], UserEntity.prototype, "refreshToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "avatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "website", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], UserEntity.prototype, "isPrivate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], UserEntity.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], UserEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], UserEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => post_entity_1.PostEntity, (post) => post.author),
    (0, graphql_1.Field)(() => [post_entity_1.PostEntity], { nullable: true }),
    __metadata("design:type", Array)
], UserEntity.prototype, "posts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => like_entity_1.LikeEntity, (like) => like.user),
    __metadata("design:type", Array)
], UserEntity.prototype, "likes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => comment_entity_1.CommentEntity, (comment) => comment.user),
    __metadata("design:type", Array)
], UserEntity.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => follow_entity_1.FollowEntity, (follow) => follow.follower),
    __metadata("design:type", Array)
], UserEntity.prototype, "following", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => follow_entity_1.FollowEntity, (follow) => follow.following),
    __metadata("design:type", Array)
], UserEntity.prototype, "followers", void 0);
exports.UserEntity = UserEntity = __decorate([
    (0, typeorm_1.Entity)('users'),
    (0, graphql_1.ObjectType)('User')
], UserEntity);
//# sourceMappingURL=user.entity.js.map