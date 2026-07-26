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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("./post.entity");
let PostsService = class PostsService {
    postRepo;
    constructor(postRepo) {
        this.postRepo = postRepo;
    }
    async create(authorId, input) {
        let hashtags = input.hashtags || [];
        if (input.caption && hashtags.length === 0) {
            const matches = input.caption.match(/#[\w\u0600-\u06FF]+/g);
            if (matches)
                hashtags = matches.map((h) => h.slice(1).toLowerCase());
        }
        let mentions = input.mentions || [];
        if (input.caption && mentions.length === 0) {
            const matches = input.caption.match(/@[\w_.]+/g);
            if (matches)
                mentions = matches.map((m) => m.slice(1).toLowerCase());
        }
        const post = this.postRepo.create({
            ...input,
            hashtags,
            mentions,
            authorId,
            mediaUrls: input.mediaUrls,
        });
        const saved = await this.postRepo.save(post);
        return this.postRepo.findOne({
            where: { id: saved.id },
            relations: ['author'],
        });
    }
    async findById(id) {
        const post = await this.postRepo.findOne({
            where: { id },
            relations: ['author'],
        });
        if (!post)
            throw new common_1.NotFoundException('post not found');
        return post;
    }
    async findByAuthor(authorId, limit = 20, offset = 0) {
        return this.postRepo.find({
            where: { authorId, archived: false },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }
    async update(postId, authorId, input) {
        const post = await this.findById(postId);
        if (post.authorId !== authorId) {
            throw new common_1.ForbiddenException('not allowed to edit this post');
        }
        Object.assign(post, input);
        return this.postRepo.save(post);
    }
    async delete(postId, authorId) {
        const post = await this.findById(postId);
        if (post.authorId !== authorId) {
            throw new common_1.ForbiddenException('not allowed to delete this post');
        }
        await this.postRepo.remove(post);
        return true;
    }
    async archive(postId, authorId, archive) {
        const post = await this.findById(postId);
        if (post.authorId !== authorId) {
            throw new common_1.ForbiddenException('not allowed');
        }
        post.archived = archive;
        return this.postRepo.save(post);
    }
    async findByHashtag(tag, limit = 20, offset = 0) {
        const normalized = tag.toLowerCase().replace(/^#/, '');
        return this.postRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.author', 'author')
            .where(`(p.hashtags = :exact OR p.hashtags LIKE :startWith OR p.hashtags LIKE :endWith OR p.hashtags LIKE :middle)`, {
            exact: normalized,
            startWith: `${normalized},%`,
            endWith: `%,${normalized}`,
            middle: `%,${normalized},%`,
        })
            .andWhere('p.archived = :archived', { archived: false })
            .orderBy('p.createdAt', 'DESC')
            .limit(limit)
            .offset(offset)
            .getMany();
    }
    async incrementLikes(postId, by = 1) {
        await this.postRepo.increment({ id: postId }, 'likesCount', by);
    }
    async decrementLikes(postId, by = 1) {
        await this.postRepo.decrement({ id: postId }, 'likesCount', by);
    }
    async incrementComments(postId, by = 1) {
        await this.postRepo.increment({ id: postId }, 'commentsCount', by);
    }
    async decrementComments(postId, by = 1) {
        await this.postRepo.decrement({ id: postId }, 'commentsCount', by);
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.PostEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PostsService);
//# sourceMappingURL=posts.service.js.map