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
exports.FeedResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const feed_service_1 = require("./feed.service");
const feed_result_1 = require("./feed-result");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const gql_auth_guard_1 = require("../auth/guards/gql-auth.guard");
const user_entity_1 = require("../users/user.entity");
let FeedResolver = class FeedResolver {
    feedService;
    constructor(feedService) {
        this.feedService = feedService;
    }
    async feed(user, limit, offset) {
        return this.feedService.getFeed(user.id, limit, offset);
    }
    async exploreFeed(limit, offset) {
        return this.feedService.getExploreFeed(limit, offset);
    }
};
exports.FeedResolver = FeedResolver;
__decorate([
    (0, graphql_1.Query)(() => feed_result_1.FeedResult, { description: 'فید شخصی کاربر (پست‌های فالووینگ + خودش)' }),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('limit', { type: () => graphql_1.Int, nullable: true, defaultValue: 20 })),
    __param(2, (0, graphql_1.Args)('offset', { type: () => graphql_1.Int, nullable: true, defaultValue: 0 })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.UserEntity, Number, Number]),
    __metadata("design:returntype", Promise)
], FeedResolver.prototype, "feed", null);
__decorate([
    (0, graphql_1.Query)(() => feed_result_1.FeedResult, { description: 'فید اکسپلور (پست‌های محبوب و جدید همه)' }),
    __param(0, (0, graphql_1.Args)('limit', { type: () => graphql_1.Int, nullable: true, defaultValue: 30 })),
    __param(1, (0, graphql_1.Args)('offset', { type: () => graphql_1.Int, nullable: true, defaultValue: 0 })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], FeedResolver.prototype, "exploreFeed", null);
exports.FeedResolver = FeedResolver = __decorate([
    (0, graphql_1.Resolver)(() => feed_result_1.FeedResult),
    __metadata("design:paramtypes", [feed_service_1.FeedService])
], FeedResolver);
//# sourceMappingURL=feed.resolver.js.map