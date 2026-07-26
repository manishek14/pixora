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
exports.FollowEntity = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
const user_entity_1 = require("../users/user.entity");
let FollowEntity = class FollowEntity {
    id;
    createdAt;
    follower;
    followerId;
    following;
    followingId;
    isAccepted;
    isCloseFriend;
};
exports.FollowEntity = FollowEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], FollowEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], FollowEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity, (user) => user.following, {
        onDelete: 'CASCADE',
        eager: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'followerId' }),
    (0, graphql_1.Field)(() => user_entity_1.UserEntity),
    __metadata("design:type", Object)
], FollowEntity.prototype, "follower", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], FollowEntity.prototype, "followerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity, (user) => user.followers, {
        onDelete: 'CASCADE',
        eager: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'followingId' }),
    (0, graphql_1.Field)(() => user_entity_1.UserEntity),
    __metadata("design:type", Object)
], FollowEntity.prototype, "following", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], FollowEntity.prototype, "followingId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], FollowEntity.prototype, "isAccepted", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], FollowEntity.prototype, "isCloseFriend", void 0);
exports.FollowEntity = FollowEntity = __decorate([
    (0, typeorm_1.Entity)('follows'),
    (0, typeorm_1.Unique)(['followerId', 'followingId']),
    (0, typeorm_1.Index)(['followerId', 'followingId']),
    (0, graphql_1.ObjectType)('Follow')
], FollowEntity);
//# sourceMappingURL=follow.entity.js.map