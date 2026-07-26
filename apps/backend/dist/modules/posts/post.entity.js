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
exports.PostEntity = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
const user_entity_1 = require("../users/user.entity");
let PostEntity = class PostEntity {
    id;
    caption;
    mediaUrls;
    hashtags;
    mentions;
    location;
    isReel;
    likesCount;
    commentsCount;
    archived;
    createdAt;
    updatedAt;
    author;
    authorId;
};
exports.PostEntity = PostEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], PostEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], PostEntity.prototype, "caption", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: '' }),
    (0, graphql_1.Field)(() => [String]),
    __metadata("design:type", Array)
], PostEntity.prototype, "mediaUrls", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: '' }),
    (0, graphql_1.Field)(() => [String]),
    __metadata("design:type", Array)
], PostEntity.prototype, "hashtags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: '' }),
    (0, graphql_1.Field)(() => [String]),
    __metadata("design:type", Array)
], PostEntity.prototype, "mentions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], PostEntity.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], PostEntity.prototype, "isReel", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], PostEntity.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], PostEntity.prototype, "commentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], PostEntity.prototype, "archived", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], PostEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], PostEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity, (user) => user.posts, {
        onDelete: 'CASCADE',
        eager: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'authorId' }),
    (0, graphql_1.Field)(() => user_entity_1.UserEntity),
    __metadata("design:type", Object)
], PostEntity.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PostEntity.prototype, "authorId", void 0);
exports.PostEntity = PostEntity = __decorate([
    (0, typeorm_1.Entity)('posts'),
    (0, graphql_1.ObjectType)('Post')
], PostEntity);
//# sourceMappingURL=post.entity.js.map