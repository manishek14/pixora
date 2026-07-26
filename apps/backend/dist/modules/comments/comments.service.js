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
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const comment_entity_1 = require("./comment.entity");
const posts_service_1 = require("../posts/posts.service");
let CommentsService = class CommentsService {
    commentRepo;
    postsService;
    constructor(commentRepo, postsService) {
        this.commentRepo = commentRepo;
        this.postsService = postsService;
    }
    async create(userId, input) {
        await this.postsService.findById(input.postId);
        const comment = this.commentRepo.create({
            userId,
            postId: input.postId,
            text: input.text,
            parentId: input.parentId || null,
        });
        const saved = await this.commentRepo.save(comment);
        await this.postsService.incrementComments(input.postId);
        const reloaded = await this.commentRepo.findOne({
            where: { id: saved.id },
            relations: ['user'],
        });
        return reloaded || saved;
    }
    async findByPost(postId, limit = 50) {
        const topLevel = await this.commentRepo.find({
            where: { postId, parentId: (0, typeorm_2.IsNull)() },
            relations: ['user'],
            order: { createdAt: 'DESC' },
            take: limit,
        });
        if (topLevel.length > 0) {
            const parentIds = topLevel.map((c) => c.id);
            const replies = await this.commentRepo
                .createQueryBuilder('c')
                .leftJoinAndSelect('c.user', 'user')
                .where('c.parentId IN (:...parentIds)', { parentIds })
                .orderBy('c.createdAt', 'ASC')
                .getMany();
            const replyMap = new Map();
            for (const reply of replies) {
                const pid = reply.parentId;
                const list = replyMap.get(pid) || [];
                list.push(reply);
                replyMap.set(pid, list);
            }
            for (const c of topLevel) {
                c.replies = replyMap.get(c.id) || [];
            }
        }
        return topLevel;
    }
    async update(commentId, userId, text) {
        const comment = await this.commentRepo.findOne({ where: { id: commentId } });
        if (!comment)
            throw new common_1.NotFoundException('comment not found');
        if (comment.userId !== userId) {
            throw new common_1.ForbiddenException('not allowed to edit this comment');
        }
        comment.text = text;
        return this.commentRepo.save(comment);
    }
    async delete(commentId, userId) {
        const comment = await this.commentRepo.findOne({ where: { id: commentId } });
        if (!comment)
            throw new common_1.NotFoundException('comment not found');
        if (comment.userId !== userId) {
            throw new common_1.ForbiddenException('not allowed to delete this comment');
        }
        const postId = comment.postId;
        await this.commentRepo.delete({ parentId: commentId });
        await this.commentRepo.remove(comment);
        await this.postsService.decrementComments(postId);
        return true;
    }
    async countByPost(postId) {
        return this.commentRepo.count({ where: { postId } });
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(comment_entity_1.CommentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        posts_service_1.PostsService])
], CommentsService);
//# sourceMappingURL=comments.service.js.map