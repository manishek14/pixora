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
exports.FollowsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const follow_entity_1 = require("./follow.entity");
const user_entity_1 = require("../users/user.entity");
let FollowsService = class FollowsService {
    followRepo;
    userRepo;
    constructor(followRepo, userRepo) {
        this.followRepo = followRepo;
        this.userRepo = userRepo;
    }
    async follow(followerId, followingId) {
        if (followerId === followingId) {
            throw new common_1.BadRequestException('cannot follow yourself');
        }
        const target = await this.userRepo.findOne({ where: { id: followingId } });
        if (!target)
            throw new common_1.NotFoundException('user not found');
        const existing = await this.followRepo.findOne({
            where: { followerId, followingId },
        });
        if (existing)
            return existing;
        const follow = this.followRepo.create({
            followerId,
            followingId,
            isAccepted: !target.isPrivate,
        });
        return this.followRepo.save(follow);
    }
    async unfollow(followerId, followingId) {
        const result = await this.followRepo.delete({ followerId, followingId });
        return (result.affected ?? 0) > 0;
    }
    async removeFollower(userId, followerId) {
        const result = await this.followRepo.delete({
            followerId,
            followingId: userId,
        });
        return (result.affected ?? 0) > 0;
    }
    async isFollowing(followerId, followingId) {
        const follow = await this.followRepo.findOne({
            where: { followerId, followingId },
        });
        return !!follow && follow.isAccepted;
    }
    async getFollowers(userId) {
        const follows = await this.followRepo.find({
            where: { followingId: userId, isAccepted: true },
            relations: ['follower'],
        });
        return follows.map((f) => f.follower);
    }
    async getFollowing(userId) {
        const follows = await this.followRepo.find({
            where: { followerId: userId, isAccepted: true },
            relations: ['following'],
        });
        return follows.map((f) => f.following);
    }
    async getFollowingIds(userId) {
        const follows = await this.followRepo.find({
            where: { followerId: userId, isAccepted: true },
            select: ['followingId'],
        });
        return follows.map((f) => f.followingId);
    }
    async getFollowersCount(userId) {
        return this.followRepo.count({
            where: { followingId: userId, isAccepted: true },
        });
    }
    async getFollowingCount(userId) {
        return this.followRepo.count({
            where: { followerId: userId, isAccepted: true },
        });
    }
    async toggleCloseFriend(ownerId, targetId, isClose) {
        const follow = await this.followRepo.findOne({
            where: { followerId: ownerId, followingId: targetId },
        });
        if (!follow)
            throw new common_1.NotFoundException('follow relationship not found');
        follow.isCloseFriend = isClose;
        return this.followRepo.save(follow);
    }
    async getCloseFriends(ownerId) {
        const follows = await this.followRepo.find({
            where: { followerId: ownerId, isCloseFriend: true },
            relations: ['following'],
        });
        return follows.map((f) => f.following);
    }
};
exports.FollowsService = FollowsService;
exports.FollowsService = FollowsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(follow_entity_1.FollowEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], FollowsService);
//# sourceMappingURL=follows.service.js.map