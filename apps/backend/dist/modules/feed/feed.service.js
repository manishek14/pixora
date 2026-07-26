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
exports.FeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("../posts/post.entity");
const follows_service_1 = require("../follows/follows.service");
let FeedService = class FeedService {
    postRepo;
    follows;
    constructor(postRepo, follows) {
        this.postRepo = postRepo;
        this.follows = follows;
    }
    async getFeed(userId, limit = 20, offset = 0) {
        const followingIds = await this.follows.getFollowingIds(userId);
        const authorIds = [userId, ...followingIds];
        if (authorIds.length === 0) {
            return { items: [], hasMore: false };
        }
        const [items, total] = await this.postRepo.findAndCount({
            where: { authorId: (0, typeorm_2.In)(authorIds), archived: false },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
            relations: ['author'],
        });
        return {
            items,
            hasMore: offset + items.length < total,
        };
    }
    async getExploreFeed(limit = 30, offset = 0) {
        const [items, total] = await this.postRepo.findAndCount({
            where: { archived: false },
            order: { likesCount: 'DESC', createdAt: 'DESC' },
            take: limit,
            skip: offset,
            relations: ['author'],
        });
        return {
            items,
            hasMore: offset + items.length < total,
        };
    }
};
exports.FeedService = FeedService;
exports.FeedService = FeedService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.PostEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        follows_service_1.FollowsService])
], FeedService);
//# sourceMappingURL=feed.service.js.map